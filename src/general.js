
export let isSubsetOf = (sub, sup) =>  
    setEquals (
        new Set(
            [...sub]
            .filter(x => [...sup].indexOf(x) >= 0) // intersection
        ), 
        sub
    );

export let asSet = obj => {

    let s = 
        obj instanceof Set ? obj
        : isString(obj) ? new Set(obj)
        : Array.isArray(obj) ? new Set(obj)
        : undefined;

    if (!s) 
        throw "Could not convert object to set";
    
    return s;

}

// Max Leizerovich: stackoverflow.com/questions/31128855
export let setEquals = (a, b) =>
    a.size === b.size 
    && [...a].every(value => b.has(value));

export let isPromise = obj => 
    Promise.resolve(obj) == obj;

export let stringifyObject = obj => {

    if (obj === undefined) 
        return '';

    let isObject = variable => 
           variable 
        && typeof variable === 'object' 
        && variable.constructor === Object;

    if (!isObject(obj))
        return obj.toString();

    let stringified = '[';

    let keys = Object.keys(obj).sort();

    for (let key of keys) {
        let val = obj[key];
        let valToStringify = isObject(val) ? stringifyObject(val) : val;
        stringified += `[${key},${valToStringify}]`;
    }

    return stringified + ']';

}

export let isString = input =>
    typeof input === 'string' 
    || input instanceof String;

export let isFunction = input => 
    typeof input === 'function';

// Thanks domino at https://stackoverflow.com/questions/18884249
export let isIterable = (input, includeStrings = false) => 
    !includeStrings && isString(includeStrings) ? false
    : Symbol.iterator in Object(input);

// array.flat not out in all browsers/node
export let flattenArray = array => {
    let result = [];
    for(let element of array) 
        if (Array.isArray(element))
            for(let nestedElement of element)
                result.push(nestedElement);
        else 
            result.push(element);
    return result;
}

// thanks shlang (8382469) at stackoverflow.com/questions/61164230
export function peekable(iterator) {

    if (Array.isArray(iterator))
        iterator = (function*(i) { yield* i; })(iterator);

    let peeked = iterator.next();
    let prev = { value: undefined, done: false, beforeStart: true };
  
    let wrapped = (function* (initial) {
      while (!peeked.done) {
        let current = peeked.value;
        prev = peeked;
        peeked = iterator.next();
        yield current;
      }
      return peeked.value;
    })();
  
    wrapped.peek = () => peeked;
    wrapped.prev = () => prev;
    return wrapped;
    
}

export let noUndefinedForFunc = mapper =>

    (...args) => {
        let result = mapper(...args);
        return noUndefined(result);
    };

export let noUndefined = obj => {
    
    for(let key of Object.keys(obj))
        if (obj[key] === undefined) 
            delete obj[key];

    return obj;

}

// equality by values
export let eq = (obj1, obj2) => {

    if (obj1 == undefined && obj2 != undefined) return false;
    if (obj1 != undefined && obj2 == undefined) return false;
    if (obj1 == undefined && obj2 == undefined) return true;

    if (isString(obj1) && isString(obj2))
        return obj1 == obj2;

    let obj1Keys = Object.keys(obj1);
    let obj2Keys = Object.keys(obj2);
    
    if (obj1Keys.length != obj2Keys.length)
        return false;

    if (obj1Keys.length == 0 && obj2Keys.length == 0)
        return obj1 == obj2;

    for(let key of obj1Keys) {
        
        if(!eq(obj1[key], obj2[key]))
            return false;
        
    }

    return true;

}

// Convert an unpromised object with promises as
// values to a promised object with regular values
export let PromiseAllObjectEntries = obj => 
    Promise.all(
        Object.entries(obj)
        .map(entry => Promise.all(entry))
    )
    .then(entries => {
        // use Object.fromEntries(entries) when node.js permits it
        let obj = {};
        for(let entry of entries) 
            obj[entry[0]] = entry[1];
        return obj;
    });


// vassarstats.net/tabs_r.html
export function studentsTfromCor (cor, n) {
    return  cor / Math.pow((1-cor*cor) / (n-2), 0.5); 
}

// stat.rice.edu/~dobelman/textfiles/DistributionsHandbook.pdf
// Though the reference doesn't say it, seems that a negative t
// needs to return 1 - result
// TODO: redo some checks.  Particularly for negative. Also,
// you may not need df == 1 logic.
export function studentsTcdf(t, df) {
    
    let result;

    if(df < 1)
        return undefined;

    else if (df % 2 == 0) {

        let x = t / Math.pow(df,0.5);

        let s = 1;
        let u = 1;
        for(let i = 1; i <= df/2 - 1; i++) {
            u *= (1 - 1/(2*i))/(1 + x*x);
            s += u;
        }

        result = 0.5 - 0.5 * s * x / Math.pow(1 + x*x, 0.5);
        
    }

    else if (df == 1) {
        let x = t / Math.pow(df,0.5);
        result = 0.5 - 1/Math.PI * Math.atan(x);
    }

    else {

        let x = t / Math.pow(df,0.5);

        let s = 0;
        let u = 1;
        for(let i = 1; i <= (df-1)/2; i++) {
            s += u;
            u *= (1 - 1/(2*i-1))/(1 + x*x);
        }

        result = 0.5 - 1/Math.PI * ( s * x/(1+x*x) + Math.atan(x));

    }

    return t < 0 ? 1 - result : result;

}

//stat.rice.edu/~dobelman/textfiles/DistributionsHandbook.pdf (p66)
export function iBeta (x, p, q) {
        
    // Convergence is better when p > q, so if that's not
    // the case, use this equivalence.    
    if(p < q) 
        return iBeta(1, q, p) - iBeta(1-x, q, p);

    let sum = 0;
    let t = 1/p;
    for(let r = 0; r <= 1000; r++) {

        if (r > 0)
            t *= (x * (r-q) * (p + r - 1)) 
            /  (r * (p + r));

        sum += t;

        if (Math.abs(t) <= 0.00000000000001)
            break;

    }

    return Math.pow(x,p) * sum;

}

export function regBeta (x, p, q) {
    return iBeta(x, p, q) / iBeta(1, p, q);
}

export function Fcdf (F, numDf, denDf) {
    let x = (F * numDf) / (denDf + (F * numDf));
    return 1 - regBeta(x, numDf/2, denDf/2);
}

