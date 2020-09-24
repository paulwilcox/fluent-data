
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

export function Fcdf (F, numDf, denDf) {
    let x = (F * numDf) / (denDf + (F * numDf));
    return 1 - regBeta(x, numDf/2, denDf/2);
}

export function gamma (z) {
    return Math.pow(Math.E, gammaLogged(z)); 
}

export function gammaLogged (z) {

    // link.springer.com/content/pdf/bbm%3A978-3-319-43561-9%2F1.pdf
    // use of 7.5 below seems odd, but from other sources it seems that it's because it's length of p - 1 + 0.5.
    // I am logging this to deal with very high values.

    let p = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7
    ];

    let sum = p[0];
    for (let i = 1; i <= 8; i++) 
        sum += p[i] / (z + i);

    return (0.5 * Math.log(2 * Math.PI) - Math.log(z))
        + Math.log(sum)
        + (z + 0.5) * Math.log(z + 7.5)
        + -(z + 7.5);

}

export function beta(a,b) {
    return Math.pow(Math.E, gammaLogged(a) + gammaLogged(b) - gammaLogged(a + b));
}

export function incBeta(
    x, 
    a, 
    b, 
    precision = 1e-8, // warning: this precision cannot go past what g.beta() can give (presently 1e-12).
    maxIterations = 1000000,
    verbose = false 
) {

    if (x == 1) {
        if (verbose) 
            console.log('x := 1, so beta() is used.');
        return beta(a,b);
    }

    // dlmf.nist.gov/8.17#SS5.p1
    // fresco.org.uk/programs/barnett/APP23.pdf (Most clear lentz reference, despite the title)
    // en.wikipedia.org/wiki/Continued_fraction (esp Theorem 4)

    // OMG, it's about as bad as the non-lentz way.  I guess efficiency isn't the
    // benefit.  Must only be the ability to stop at arbitrary precision.

    let d2m = (m) => {
        m = m/2;
        return (m*x*(b-m)) / ((a+2*m-1) * (a+2*m));
    };

    let d2mp1 = (m) => {
        m = m - 1; m = m/2;
        return - ((a+m)*(a+b+m)*x) / ((a+2*m)*(a+2*m+1));
    }

    let an = (n) => 
          n == 1 ? 1 // first numerator is 1
        : (n-1) %2 == 0 ? d2m(n-1) // after that, the d-sub-n is off by 1
        : d2mp1(n-1); 

    let bn = (n) => 1;

    // how does this even work when x = 1?
    let multiplier = (Math.pow(x,a)*Math.pow(1-x,b)) / (a*beta(a,b));
    let small = 1e-32;

    let F = small;
    let C = small;
    let D = 0;
    let CD;

    for (let n = 1; n <= maxIterations; n++) {
        
        let _bn = bn(n);
        let _an = an(n);
        C = (_bn + _an / C) || small; 
        D = (_bn + _an * D) || small;
        D = 1 / D;
        CD = C * D;
        F *= CD;

        // Various literature shows that you can to set CD to be below a 
        // ceratin precision, and stop there.  But this may cut it off
        // earlier than you desire.  This is particularly true if your
        // working result keeps rising very slowly.  Then any one change 
        // can be small but the aggregate of many future iterations might
        // be substantial, and so your approximation is off.  So I'm 
        // multiplying CD by the number of iterations left.  This is 
        // worst case for how much change can be expected.  If that is 
        // under desired precision, then no point in going further.
        if (Math.abs(CD-1) * (maxIterations - n) < precision) {
            if (verbose)
                console.log(`Reached desired precison in ${n} iterations.`)
            return multiplier * F;
        }

    }

    throw   `Could not reach desired CD precision of ${precision} ` +
            `within ${maxIterations} iterations.  ` +
            `Answer to this point is ${multiplier * F}, ` +
            `and CD is ${CD}.`

}

export function regBeta (x, p, q) {
    return incBeta(x, p, q) / beta(p, q);
}

export function invRegBeta (x, a, b) {

    // This is a very crude implementation.  For the future, look into the following references:
        // boost.org/doc/libs/1_35_0/libs/math/doc/sf_and_dist/html/math_toolkit/special/sf_beta/ibeta_inv_function.html
        // malishoaib.wordpress.com/2014/05/30/inverse-of-incomplete-beta-function-computational-statisticians-wet-dream/
        // Apparently, I'm not the only one who thinks it's difficult:
            // en.wikipedia.org/wiki/Quantile_function#Student's_t-distribution 
            // "This has historically been one of the more intractable cases..."

    // Get the middle number and round it appropriately so that 
    // it outputs matching digits and hides unmatching digits
    let roundedMid = (a, b) => {
        let roundMultiplier = 1 / Number((b - a).toFixed(20).match(/^0.0*/)[0] + '1');
        let mid = (a + b) / 2;
        return Math.round(mid * roundMultiplier) / roundMultiplier;
    }

    let honeIn = (min, max, iterations, accuracy) => {

        let mid = (min + max) / 2;
        
        if (max - min < accuracy) 
            return roundedMid(min, max);

        if (iterations == 0)
            throw `inverse beta function could not reach accuracy within the maximum number of iterations.`

        let _min = regBeta(min, a, b);
        let _mid = regBeta(mid, a, b);
        let _max = regBeta(max, a, b);

        if (x > _max) return null;
        if (x < _min) return null;
        if (x == _min) return min;
        if (x == _mid) return mid;
        if (x == _max) return max; 
        if (x < _mid) return honeIn(min, mid, iterations - 1, accuracy);
        if (x > _mid) return honeIn(mid, max, iterations - 1, accuracy);

    } 

    return honeIn(0, 1, 1000, 0.00000001);

}

// I'm not using this, but I worked so hard on it and I don't have any 
// other place to put it right now.
class hyperGeo {
    
    constructor(
        iterations = 1000, 
        precision = 1e-10
    ) {
        this.iterations = iterations;
        this.precision = precision;
    }

    execute (a,b,c,z) {

        let sum = 1;
        let add;

        for(let n = 1; n <= this.iterations; n++) {

            let zn = Math.log(Math.pow(z,n));
            if (zn == 0)
                zn = 1e-10;

            add = ( (this.pochLogged(a,n) + this.pochLogged(b,n)) - this.pochLogged(c,n) ) 
                    + (zn - this.factLogged(n));

            add = Math.pow(Math.E, add);

            if (!isFinite(add)) 
                throw `The next value to add is not finite (sum til now: ${sum}, adder: ${add})`

            sum += add;

            if(Math.abs(add) <= this.precision)
                return sum;

        }

        throw `Couldn't get within in ${this.precision} (sum: ${sum}, adder: ${add})`;

    }

    pochLogged(q, n) {
        if (n == 0)
            return 1;
        let prod = Math.log(q);
        for (let i = 1; i < n; i++) 
            prod += Math.log(q + i);
        if (prod == 0) 
            prod = 1e-10;
        return prod;
    }

    factLogged(num) {
        let prod = Math.log(num);
        for (let i = num - 1; i >= 1; i--)
            prod += Math.log(i);
        return prod;
    }


}