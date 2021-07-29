/**
 * ISC License (ISC)
 * Copyright (c) 2019, Paul Wilcox <t78t78@gmail.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

'use strict';

// e.g. roundToMultiple(5.239, 0.25) is 5.25 becasue that is the closest 0.25th 
let round = (term, multiple) => {

    if (term === null || term === undefined)
        return term;

    if (typeof(term) === 'object') {
        for(let key of Object.keys(term)) {
            let type = typeof(term[key]);
            term[key] = (type === 'number' || type == 'object') 
                ? round(term[key], multiple)
                : term[key];
        }
        return term;
    }

    // Binary and floating point arithmetic sometimes makes it so that the
    // result comes out as a long decimal with an extreme fraction at the
    // end.  Obviously that's annoying as this is a rounding function.
    // This seeks to cut that off by getting the number of digits of the 
    // multiple parameter and rounding to that.
    let multStr = multiple.toExponential();
    let [multNonE, multE] = multStr.split('e');
    let multDec = (multNonE.split('.')[1] || '').length - parseInt(multE);

    term = Math.round(term / multiple) * multiple;
    return roundToDigits(term, multDec);

};

// e.g. round(5.239, 2) is 5.24
let roundToDigits = (term, digits) => {

    if (term === null || term === undefined)
        return term;

    let val = Math.round(term * 10 ** digits) / 10 ** digits;

    if (!isNaN(val))
        return val;
    if (typeof(term) != 'object')
        return val;

    for(let key of Object.keys(term)) {
        let type = typeof(term[key]);
        term[key] = (type === 'number' || type == 'object') 
            ? roundToDigits(term[key], digits)
            : term[key];
    }

    return term;

};

// developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
let random = (min, max, integers = false) => {
    if (integers) {
        min = Math.ceil(min);
        max = Math.floor(max);
    }
    return integers 
        ? Math.floor(Math.random() * (max - min + 1)) + min
        : Math.random() * (max - min) + min;
};

let isSubsetOf = (sub, sup) =>  
    setEquals (
        new Set(
            [...sub]
            .filter(x => [...sup].indexOf(x) >= 0) // intersection
        ), 
        sub
    );

let asSet = obj => {

    let s = 
        obj instanceof Set ? obj
        : isString(obj) ? new Set(obj)
        : Array.isArray(obj) ? new Set(obj)
        : undefined;

    if (!s) 
        throw "Could not convert object to set";
    
    return s;

};

// Max Leizerovich: stackoverflow.com/questions/31128855
let setEquals = (a, b) =>
    a.size === b.size 
    && [...a].every(value => b.has(value));

let isPromise = obj => 
    Promise.resolve(obj) == obj;

// this is obsolete but I don't have the
// heart to get rid of it right now.
let stringifyObject = obj => {

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

};

let isString = input =>
    typeof input === 'string' 
    || input instanceof String;

let isFunction = input => 
    typeof input === 'function';

// Thanks domino at https://stackoverflow.com/questions/18884249
let isIterable = (input, includeStrings = false) => 
    !includeStrings && isString(includeStrings) ? false
    : Symbol.iterator in Object(input);

// array.flat not out in all browsers/node
let flattenArray = array => {
    let result = [];
    for(let element of array) 
        if (Array.isArray(element))
            for(let nestedElement of element)
                result.push(nestedElement);
        else 
            result.push(element);
    return result;
};

// thanks shlang (8382469) at stackoverflow.com/questions/61164230
function peekable(iterator) {

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

let noUndefinedForFunc = mapper =>

    (...args) => {
        let result = mapper(...args);
        return noUndefined(result);
    };

let noUndefined = obj => {
    
    for(let key of Object.keys(obj))
        if (obj[key] === undefined) 
            delete obj[key];

    return obj;

};

let dotsToProps = (obj) => {

    let dottedKeys = Object.keys(obj)
        .sort()
        .map(key => key.split('.').map(part => part.trim()))
        .filter(parts => parts.length > 1);

    for(let dk in dottedKeys) {
        let dottedKey = dottedKeys[dk];
        let joinedKey;
        let prevPart = obj;
        for(let p in dottedKey) {
            let part = dottedKey[p];
            joinedKey = p == 0 ? part : `${joinedKey}.${part}`;
            if (prevPart[part] === undefined) 
                try { prevPart[part] = {}; }
                catch (err) {
                    err.message = `Problem setting value for '${joinedKey}'.  ${err.message}`;
                    throw err;
                }
            if (p == dottedKey.length - 1) 
                prevPart[part] = obj[joinedKey];
            prevPart = prevPart[part];
        } 
        delete obj[joinedKey];
    }

    return obj;
    
};

// equality by values
let eq = (obj1, obj2) => {

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

};

// Convert an unpromised object with promises as
// values to a promised object with regular values
let PromiseAllObjectEntries = obj => 
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

function tableToString (
    data, 
    caption,
    mapper, 
    limit = 50, 
    headers = true,
    preferEmptyString = true, // if false, '<null>' and '<undefined>' can show
    bordersBefore = null // [[a,b,c],[x,y,z]], borders before resp. row and col ix posits
) {

    mapper = mapper || (x => x);
    let props = [];
    let vals = [];

    if (data.length == 0) {
        data = [{ empty: '' }];
        headers = false;
    }

    let safeToString = (val) =>  
          val === null ? (preferEmptyString ? '' : '<null>') 
        : val === undefined ? (preferEmptyString ? '' : '<undefined>')
        : val.toString();

    // Initially, values are multi-line.  Even if just 
    // one line they're represented as an array.
    let toStringArray = (val) => safeToString(val).split(`\r\n`);

    for(let r = 0; r < data.length; r++) {
        
        if (r >= limit)
            break;

        let row = noUndefined(mapper(data[r]));
        let rowVals = [];
        let rowProps = Object.getOwnPropertyNames(row);

        // force the order of props in previous rows
        for(let i = 0; i < props.length; i++) {
            let prop = props[i];
            let arrayVal = toStringArray(row[prop]);
            rowVals.push(arrayVal);
        }

        // add new props if not previously known
        for(let i = 0; i < rowProps.length; i++) {
            let prop = rowProps[i];
            let arrayVal = toStringArray(row[prop]);

            if (!props.includes(prop)) {
                props.push(prop);
                rowVals.push(arrayVal);
            }
        }

        // spread out the arrayVals into different lines
        // [['one line'],['two','lines']] becomes 
        // [['one line', 'two'], ['', 'lines']]
        let maxLen = Math.max(...rowVals.map(arrayVal => arrayVal.length));
        for(let i = 0; i < maxLen; i++) {
            let flattened = [];
            for (let arrayVal of rowVals) 
                flattened.push(arrayVal[i] || '');
            vals.push(flattened);
        }

    }    

    let lengths = [];

    for (let i = 0; i < props.length; i++) 
        lengths[i] = Math.max(
            ...vals.map(row => safeToString(row[i]).length), 
            headers ? props[i].length : 0
        );

    for(let i = 0; i < props.length; i++)
        props[i] = props[i].padEnd(lengths[i]);

    for(let row of vals)
        for(let i = 0; i < props.length; i++) 
            row[i] = safeToString(row[i]).padEnd(lengths[i]);

    let chr = (notBb,bb) => bordersBefore ? bb : notBb;
    let tl = chr('\u250c', '\u2554');
    let tm = chr('\u252c', '\u2564');
    let tr = chr('\u2510', '\u2557');
    let ml = chr('\u251c', '\u2560');
    let mm = chr('\u253c', '\u256a');
    let mr = chr('\u2524', '\u2563');
    let bl = chr('\u2514', '\u255a');
    let bm = chr('\u2534', '\u2567');
    let br = chr('\u2518', '\u255d');
    let hz = chr('\u2500', '\u2550');
    let vl = chr('\u2502', '\u2551');
    let vm = chr('\u2502', '\u250a');
    let vr = chr('\u2502', '\u2551');
    let nl = '\r\n';
    let sp = ' ';

    let topBorder = tl+hz + lengths.map(l => ''.padStart(l,hz+hz+hz)).join(hz+tm+hz) + hz+tr+nl;
    let headerRow = vl+sp + props.join(sp+vm+sp) + sp+vr+nl;
    let divider = ml+hz + lengths.map(l => ''.padStart(l,hz+hz+hz)).join(hz+mm+hz) + hz+mr+nl;
    let dataRows = vals.map(row => vl+sp + row.join(sp+vm+sp) + sp+vr).join(nl) + nl;
    let botBorder = bl+hz + lengths.map(l => ''.padStart(l,hz+hz+hz)).join(hz+bm+hz) + hz+br;

    // add special row borders
    if (bordersBefore && bordersBefore[0]) {
        dataRows = dataRows.split(nl);
        let bbRev = [...bordersBefore[0]];
        bbRev.reverse();
        for (let bb of bbRev)
            dataRows.splice(bb, 0, 
                divider
                    .replace(new RegExp(hz,'g'), '\u2550')
                    .replace(nl,'')
            );
        dataRows = dataRows.join(nl);
    }

    let result = 
        topBorder +
        (headers ? headerRow : '') + 
        (headers ? divider : '') +
        dataRows +
        botBorder;

    // add special column borders
    if (bordersBefore && bordersBefore[1]) {

        bordersBefore[1] = // convert col posit to char posit
            [...topBorder]
            .map((chr,ix) => chr == tm ? ix : null)
            .filter(ix => ix !== null)
            .filter((x,ix) => bordersBefore[1].includes(ix));

        for(let bb of bordersBefore[1]) {
            let replacer = (val,rep) => 
                result.replace(new RegExp(`(?<=^.{${bb}})${val}`,'gm'), rep);
            result = replacer(vm,vl);
            result = replacer(tm, '\u2566');
            result = replacer(mm, '\u256c');
            result = replacer(bm, '\u2569');
        }

    }

    result = (caption ? (caption+nl) : '') + result;
    return result;

}


// vassarstats.net/tabs_r.html
function studentsTfromCor (cor, n) {
    return  cor / Math.pow((1-cor*cor) / (n-2), 0.5); 
}

// stat.rice.edu/~dobelman/textfiles/DistributionsHandbook.pdf
// Though the reference doesn't say it, seems that a negative t
// needs to return 1 - result
// TODO: redo some checks.  Particularly for negative. Also,
// you may not need df == 1 logic.
function studentsTcdf(t, df) {
    
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

// Get Student's T critical value from probability 
function studentsTquantile(quantile, df) {

    // homepages.ucl.ac.uk/~ucahwts/lgsnotes/JCF_Student.pdf

    if (quantile < 0 || quantile > 1)
        throw `quantile passed to studentsT() must be between 0 and 1 (${quantile} passed)`;

    let ib = invIncBeta(
        quantile < 0.5 ? 2 * quantile : 2 * (1-quantile), 
        df/2, 
        0.5, 
        1e-12
    );

    let inner = df * (1/ib - 1);
    return Math.sign(quantile - 0.5) * Math.pow(inner, 0.5);

}

function Fcdf (F, numDf, denDf) {
    let x = (F * numDf) / (denDf + (F * numDf));
    return 1 - incBeta(x, numDf/2, denDf/2);
}

// Get Fisher's F critical value from probability
// TODO: Make sure direction of quantile is same as student's t
function Fquantile(quantile, df1, df2) {
    return g.getInverse(
        (input) => g.Fcdf(input, df1, df2),
        1 - quantile,
        1e-12, // precision to desired output
        1000,
        0,
        5,
        0,
        null
    );
}

function chiCdf (chi, df) {
    let regGamma = (a,b) => incGammaLower(a, b) / gamma(a);
    let result = regGamma(df/2, chi/2);
    return 1 - result; // upper
}

function gamma (z) {
    return Math.pow(Math.E, gammaLogged(z)); 
}

function gammaLogged (z) {

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

function incGamma(a, z) {
    return gamma(a) - incGammaLower(a, z);
}

function incGammaLower (a, z) {

    // dlmf.nist.gov/8.11#ii (way better than continued fraction)

    let sum = 0;
    for (let k = 0; k <= 1000; k++) {
        let numerator = k * Math.log(z);
        let denominator = pochLogged(a, k+1);
        sum += Math.pow(Math.E, numerator - denominator);
    }

    return Math.pow(z,a) * Math.pow(Math.E, -z) * sum;

}

function beta(a,b) {
    return Math.pow(Math.E, gammaLogged(a) + gammaLogged(b) - gammaLogged(a + b));
}

function incBeta(
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
    };

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
        
        let _bn = bn();
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
                console.log(`Reached desired precison in ${n} iterations.`);
            return multiplier * F;
        }

    }

    throw   `Could not reach desired CD precision of ${precision} ` +
            `within ${maxIterations} iterations.  ` +
            `Answer to this point is ${multiplier * F}, ` +
            `and CD is ${CD}.`

}

function invIncBeta (
    x, 
    a,
    b, 
    precision = 1e-8, 
    maxIterations = 1000
) {

    // This is a very crude implementation.  For the future, look into the following references:
        // boost.org/doc/libs/1_35_0/libs/math/doc/sf_and_dist/html/math_toolkit/special/sf_beta/ibeta_inv_function.html
        // malishoaib.wordpress.com/2014/05/30/inverse-of-incomplete-beta-function-computational-statisticians-wet-dream/
        // Apparently, I'm not the only one who thinks it's difficult:
            // en.wikipedia.org/wiki/Quantile_function#Student's_t-distribution 
            // "This has historically been one of the more intractable cases..."

    // TODO: See if this can work with getInverse.  Unfortunately, right now it's not.

    let honeIn = (min, max, iterations) => {

        let mid = (min + max) / 2;
        
        if (Math.abs(max - min) < precision) 
            return mid;

        if (iterations == 0)
            throw `inverse beta function could not reach accuracy within the maximum number of iterations.`

        let _min = incBeta(min, a, b);
        let _mid = incBeta(mid, a, b) || precision; // result can be so tiny that javascript registers 0.  E.g.: incBeta(0.5, 5000, 0.5)
        let _max = incBeta(max, a, b);

        //if (x > _max) return null;
        //if (x < _min) return null;
        if (x == _min) return min;
        if (x == _mid) return mid;
        if (x == _max) return max; 
        if (x < _mid) return honeIn(min, mid, iterations - 1);
        if (x > _mid) return honeIn(mid, max, iterations - 1);

    }; 

    return honeIn(0, 1, maxIterations);

}

// I think 'func' must be continuously increasing or continuously decreasing 
// for this to work.  But this means that this is good for finding
// inverses of cumulative distributions, which continuously increase (or 
// decrease if looking for upper area under curve). 
function getInverse (
    func,
    desiredOutput,
    precision, // precision to desired output
    maxIterations,
    minInputStart,
    maxInputStart,
    minInputPossible,
    maxInputPossible
) {
    
    let bound = (val) => 
          val < minInputPossible ? minInputPossible 
        : val > maxInputPossible ? maxInputPossible
        : val;

    let minInput = minInputStart;
    let maxInput = maxInputStart;

    for (let i = 0; i <= maxIterations; i++) {

        if (i == maxIterations)
            throw   `Inverse with precision of ${precision} could not be found ` + 
                    `within ${maxIterations} iterations.  Increase the max iterations ` +
                    `allowed.  And be sure that your function is continuously increasing ` +
                    `or decreasing (or else infinite recursion is possible), or else be ` +
                    `sure that your input starts guarantee a solution.`;

        let midInput = (minInput + maxInput) / 2;
        let inputSpread = maxInput - minInput;

        let minOutput = func(minInput);
        let midOutput = func(midInput); 
        let maxOutput = func(maxInput);

        let isAscending = maxOutput > minOutput;
        let conditioner = (condition) => isAscending ? condition : !condition; 

        if (desiredOutput == minOutput) return minInput;
        if (desiredOutput == maxOutput) return maxInput;
        if (Math.abs(desiredOutput - midOutput) < precision) return midInput;

        if (midOutput == minOutput || midOutput == maxOutput)
            midOutput = (minOutput + maxOutput) / 2; // sometimes precision is so close mid becomes equal to mid or max.

        if (conditioner(desiredOutput < minOutput)) 
            minInput = bound(minInput - 2*inputSpread);
        else if (conditioner(desiredOutput > maxOutput)) 
            maxInput = bound(maxInput + 2*inputSpread);
        else if (conditioner(desiredOutput < midOutput)) 
            maxInput = midInput;
        else if (conditioner(desiredOutput > midOutput)) 
            minInput = midInput;

    } 

}

function pochLogged (q, n) {
    if (n == 0)
        return 1;
    let prod = Math.log(q);
    for (let i = 1; i < n; i++) 
        prod += Math.log(q + i);
    if (prod == 0) 
        prod = 1e-10;
    return prod;
}

var g$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  round: round,
  roundToDigits: roundToDigits,
  random: random,
  isSubsetOf: isSubsetOf,
  asSet: asSet,
  setEquals: setEquals,
  isPromise: isPromise,
  stringifyObject: stringifyObject,
  isString: isString,
  isFunction: isFunction,
  isIterable: isIterable,
  flattenArray: flattenArray,
  peekable: peekable,
  noUndefinedForFunc: noUndefinedForFunc,
  noUndefined: noUndefined,
  dotsToProps: dotsToProps,
  eq: eq,
  PromiseAllObjectEntries: PromiseAllObjectEntries,
  tableToString: tableToString,
  studentsTfromCor: studentsTfromCor,
  studentsTcdf: studentsTcdf,
  studentsTquantile: studentsTquantile,
  Fcdf: Fcdf,
  Fquantile: Fquantile,
  chiCdf: chiCdf,
  gamma: gamma,
  gammaLogged: gammaLogged,
  incGamma: incGamma,
  incGammaLower: incGammaLower,
  beta: beta,
  incBeta: incBeta,
  invIncBeta: invIncBeta,
  getInverse: getInverse
});

function* quickSort (
    unsorted, 
    func,
    funcReturnsArray
) {

    // Initializations

        let lesserThans = [];
        let greaterThans = [];
        let pivot;

    // Get the first of unsorted, establish it as the pivot
        
        if (!Array.isArray(unsorted)) {
            pivot = unsorted.next();
            if (pivot.done)
                return pivot.value;
            pivot = pivot.value; 
        } 
        else 
            pivot = unsorted.pop();

    // Compare remaining rows to the pivot and put into 
    // bins of lesser records and equal/greater records.
                
        let pivotSelection = funcReturnsArray ? func(pivot) : null;

        for (let row of unsorted) {

            let orderDecision = funcReturnsArray
                ? compareArrays(func(row), pivotSelection) // func returns array
                : func(row, pivot); // func returns boolean

            orderDecision == -1
                ? lesserThans.push(row) 
                : greaterThans.push(row);

        }

    // output in the incrementally better order 
        
        if (lesserThans.length > 0)
            yield* quickSort(lesserThans, func, funcReturnsArray);
        
        yield pivot;
        
        if (greaterThans.length > 0)
            yield* quickSort(greaterThans, func, funcReturnsArray);

}
// Capture lessThan (-1), greaterThan (1) or equal (0)
function compareArrays (
    leftVals,
    rightVals
) {

    // User has option to pass array as orderFunc to
    // created steped orderings.  If they don't pass
    // an array, just wrap in one at this step.
    if (!Array.isArray(leftVals))
        leftVals = [leftVals];
    if (!Array.isArray(rightVals))
        rightVals = [rightVals];
        
    let length = leftVals.length > rightVals.length
        ? leftVals.length
        : rightVals.length;

    for(let i = 0; i < length; i++) {
        if (leftVals[i] < rightVals[i]) return -1;
        if (leftVals[i] > rightVals[i]) return 1;
    }

    return 0;

}

class matrix {

    constructor (
        data, 
        selector = arrayRow => arrayRow, // csv of prop names or func returning array of numbers
        rowNames // string of a prop name or func identifiying the property representing the name
    ) {                

        this.colNames = null;
        this.rowNames = null;
        this.data;

        if (!data) {
            this.data = [];
            return;
        }
    
        // if selector is csv, split and turn it into a property selecctor
        if (isString(selector)) {
            this.colNames = selector.split(',').map(name => name.trim());
            selector = (row) => this.colNames.map(name => row[name]);
        }

        try {
            this.data = data.map(selector);
        } 
        catch(e) {
            console.log(this.data);
            throw e;
        }

        if (rowNames)
            this.rowNames = isString(rowNames)
                ? data.map(row => row[rowNames])
                : data.map(rowNames);

        if (this.colNames == null)
            this.colNames = this.data.length == 0 ? null : this.data[0].map((v,ix) => `c${ix}`);
        
        if (this.rowNames == null)
            this.rowNames = this.data.map((v,ix) => `r${ix}`);                        

        this.validate();

    }

    get nRow() { return this.data.length; }
    get nCol() { return this.data[0].length; }
    get nCell() { return this.data.reduce((a,b) => a + b.length, 0); }    

    get rows() { 
        let _this = this; 
        return {
            [Symbol.iterator]: function* () {
                for(let r = 0; r < _this.nRow; r++) 
                    yield _this.filter(r,null);
            }
        }
    }

    get cols() { 
        let _this = this; 
        return {
            [Symbol.iterator]: function* () {
                for(let c = 0; c < _this.nCol; c++) 
                    yield _this.filter(null,c);
            }
        }
    }

    setColNames (colNames) {
        let mx = this.clone();
        if (isString(colNames))
            colNames = colNames.split(',').map(name => name.trim());
        if (mx.data.length > 0 && mx.data[0].length != colNames.length)
            throw `colNames is not of the same length as a row of data.`
        mx.colNames = colNames;
        return mx;
    }

    setRowNames (rowNames) {
        let mx = this.clone();
        if (isString(rowNames))
            rowNames = rowNames.split(',').map(name => name.trim());
        if (mx.data.length > 0 && mx.data.length != rowNames.length)
            throw `rowNames is not of the same length as the data.`
        mx.rowNames = rowNames;
        return mx;
    }

    validate() {
        for(let r in this.data) {
            if (!Array.isArray(this.data[r]))
                throw `Row ${r} is not an array;`
            for(let c in this.data[r]) {
                if (!isFinite(this.data[r][c]))
                    if(this.colNames) throw `'${this.colNames[c]}' in row ${r} is not a finite number`;
                    else throw `Cell ${c} in row ${r} is not a finite number;` 
            }
        }
        return this;
    }

    clone() {
        let mx = new matrix();
        mx.data = [];
        for(let row of this.data) 
            mx.data.push([...row]);
        if (this.colNames)
            mx.colNames = [...this.colNames];
        if (this.rowNames)
            mx.rowNames = [...this.rowNames];
        return mx;
    }

    appendCols(other) {
        let mx = this.clone();
        if (Array.isArray(other)) 
            other = new matrix(other);
        if (other.nRow > mx.nRow)
            throw `incoming data has more rows than existing data`;
        for(let r = 0; r < mx.nRow; r++) 
            mx.data[r].push(...other.data[r]);
        if (other.colNames)
            mx.colNames.push(...other.colNames);
        mx.validate();
        return mx;
    }

    appendRows(other) {
        let mx = this.clone();
        if (Array.isArray(other))
            other = new matrix(other);
        if (other.nCol > mx.nCol)
            throw `incoming data has more columns than existing data`;
        for (let r = 0; r < other.nRow; r++) {
            if (other.rowNames)
                mx.rowNames.push(other.rowNames[r]);
            mx.data.push(other.data[r]);
        }
        mx.validate();
        return mx;
    }

    log (
        element = null, 
        caption = null, 
        mapper = x => x, 
        limit = 50, 
        {
            headers = true,
            preferEmptyString = true,
            bordersBefore = null
        } = {}
    ) {

        let clone = this.clone();
        let printable = [];
        
        // if param 3 is a number, the use it as a round multiple
        let _mapper = !isNaN(mapper) ? row => round(row, mapper) : mapper;        

        for (let r in clone.data) {
            let row = {};
            let rowName = clone.rowNames ? (clone.rowNames[r] || `r${r}`) : `r${r}`;
            row[''] = [rowName]; 
            for (let c in clone.data[r]) {
                let colName = clone.colNames ? (clone.colNames[c] || `c${c}`) : `c${c}`;
                row[colName] = clone.data[r][c];
            }
            printable.push(row);
        }

        let printed = tableToString(
            printable, caption, _mapper, 
            limit, headers, preferEmptyString, bordersBefore
        );
        
        if (!element)
            console.log(printed);
        else {
            let div = document.createElement('div');
            div.style = 'white-space:pre; font-family:consolas; font-size:x-small';
            div.innerHTML = printed;
            document.querySelector(element).appendChild(div);            
        }

        return this;

    }

    isSquare() {
        if (this.data.length == 0)
            return true;
        let rows = this.data.length;
        let cols = this.data[0].length;
        return rows == cols;
    }

    // zeroThreshold allows very small numbers to count as 0
    isLowerTriangular(zeroThreshold = 0) {
        for (let r = 0; r < this.data.length; r++)
        for (let c = r; c < this.data[0].length; c++) 
            if (r != c && Math.abs(this.data[r][c]) > zeroThreshold)
                return false;
        return true;
    }

    // zeroThreshold allows very small numbers to count as 0
    isUpperTriangular(zeroThreshold = 0) {
        for (let c = 0; c < this.data[0].length; c++) 
        for (let r = c; r < this.data.length; r++)
            if (r != c && Math.abs(this.data[r][c]) > zeroThreshold)
                return false;
        return true;
    }

    isDiagonal(zeroThreshold = 0) {
        for (let r = 0; r < this.data.length; r++)
        for (let c = 0; c < this.data[0].length; c++)
            if (r != c && Math.abs(this.data[r][c]) > zeroThreshold)
                return false;
        return true;
    }

    isOrthonormal(errorThreshold = 1e-8) {
        let pi = this.pseudoInverse(); 
        let t = this.transpose();
        if (!pi.equals(t,errorThreshold))
            return false;
        for (let row of this.rows) 
            if (Math.abs(row.norm('euclidian')) - 1 > errorThreshold)
                return false;
        for (let col of this.cols) 
            if (Math.abs(col.norm('euclidian')) - 1 > errorThreshold)
                return false;
        return true;
    }

    transpose() {

        let result = [];
        for(let r in this.data) 
            for(let c in this.data[r]) 
                if (r == 0)
                    result.push([this.data[r][c]]);
                else 
                    result[c].push(this.data[r][c]);
        
        let mx = new matrix(result);
        let rn = this.rowNames;
        let cn = this.colNames;
        mx.rowNames = cn;
        mx.colNames = rn;

        return mx;

    }

    // (func) or (otherMatrix, func)
    apply(...args) {

        let func = typeof args[0] == 'function' 
            ? (r,c) => args[0](this.data[r][c])
            : (r,c) => args[1](this.data[r][c], args[0].data[r][c]); 

        let mx = this.clone();

        for(let r in mx.data)
            for (let c in mx.data[r])
                mx.data[r][c] = func(r,c);

        return mx;

    }
    //
    add(other) {
        return this.apply(other, (a,b) => a+b);
    }
    //
    subtract(other) {
        return this.apply(other, (a,b) => a-b);
    }

    reduce(direction, func, seed = undefined) {

        let aggregated = [];
        let mx = this.clone();

        if (direction == 'row' || direction == 1) {
            mx.colNames = null;
            for (let row of mx.data) 
                if (seed != undefined)
                    aggregated.push([row.reduce(func, seed)]);
                else 
                    aggregated.push([row.reduce(func)]);
        }

        else if (direction == 'col' || direction == 'column' || direction == 2) {
            mx.rowNames = null;
            let colCount = mx.data.length == 0 ? 0 : mx.data[0].length;
            for (let c = 0; c < colCount; c++) {
                let agg = seed || 0;
                for(let row of mx.data) 
                    agg = func(agg, row[c]);
                aggregated.push(agg);
            }
            aggregated = [aggregated];
        }

        else if (direction == 'all' || direction == 0) {
            mx.rowNames = null;
            mx.colNames = null;
            let agg = seed || 0;
            for (let row of mx.data)
                for (let cell of row)
                    agg = func(agg, cell);
            aggregated.push([agg]);
        }

        mx.data = aggregated;
        return mx;

    }

    multiply(other) {

        let mx = this.clone();

        if (!isNaN(other) && isFinite(other)) 
            for (let r in mx.data)
                for (let c in mx.data[r])
                    mx.data[r][c] *= other;

        else if (Array.isArray(other))  {
            mx.colNames = null;
            mx.data = mx._multiplyVector(other);
        }

        else if (other instanceof matrix) {
            mx.colNames = other.colNames;
            mx.data = mx._multiplyMatrix(other);
        }

        else // I'm not sure I'm keeping arrays, so I'm not mentioning them here.
            throw `In 'matrix.multiply(other)', 'other' is not a scalar or matrix.`; 

        return mx;

    }

    _multiplyVector(other) {

        if (this.data[0].length != other.length)
            throw   `Matrix has ${this.data[0].length + 1} columns.  ` + 
                    `Vector has ${other.length + 1} elements.  ` + 
                    `Cannot multiply matrix by vector unless these match.  `

        let result = [];

        for (let r in this.data) {
            result.push([]);
            let agg = 0;
            for (let ix in this.data[r]) 
                agg += this.data[r][ix] * other[ix];
            result[r].push(agg);
        }

        return result;         

    }

    _multiplyMatrix(other) {

        if (this.data[0].length != other.data.length) 
            throw   `Left matrix has ${this.data[0].length} columns.  ` + 
                    `Right matrix has ${other.data.length} rows.  ` + 
                    `Matrix multiplication cannot be performed unless these match.  `;

        let result = [];

        for (let r in this.data) {
            result.push([]);
            for(let oCol = 0; oCol <= other.data[0].length - 1; oCol++) {
                let agg = 0;
                for (let ix in this.data[r]) 
                    agg += this.data[r][ix] * other.data[ix][oCol];
                result[r].push(agg);
            }
        }

        return result;

    }

    transform(
        transformer, 
        pointsAreRows = true // If [{x0,y0}{x1,y1}], then true.  If [{x0,x1},{y0,y1}], then false
    ) {

        // For this transform, points should be represented as columns.
        // But for most business purposes, they'll be rows.  
        // So just correct that as necessary.
        let mx = pointsAreRows 
            ? this.transpose()
            : this.clone();

        if (transformer.nCol != mx.nRow && transformer.nCol != mx.nRow + 1) 
            throw `In order to apply the transformer ` + 
                `with pointsAreRows = ${pointsAreRows}, ` +
                `the transformer columns must be the same length as ` +
                `the calling matrix ${(pointsAreRows ? 'columns' : 'rows')} ` +
                `(or the transformer can have one extra column for affine transforms).  ` +
                `Transformer is ${transformer.nRow}x${transformer.nCol}.  ` +
                `Calling Matrix is ${this.nRow}x${this.nCol}`; 

        // if the user passed a non-affine transformer, then convert it to an
        // equivalent affine transformer.
        if (transformer.nCol == mx.nRow) {
            transformer = transformer.appendRows(matrix.zeroes(1, transformer.nCol));
            transformer = transformer.appendCols(matrix.zeroes(transformer.nRow, 1));
            transformer.data[transformer.nRow - 1][transformer.nCol - 1] = 1;
        }

        // append a dimension of ones to allow affine transform
        mx = mx.appendRows(matrix.ones(1, mx.nCol));

        // carry out the transformation
        mx = transformer.multiply(mx);

        // remove the extra dimension created for the affined transform
        mx = mx.filter(-(mx.nRow - 1));

        // restore the original point orientation
        if (pointsAreRows)
            mx = mx.transpose();

        // terminate
        mx.rowNames = this.rowNames;
        mx.colNames = this.colNames;
        return mx;

    }

    // TODO: consider replacing this with pseudoInverse
    inverse() {

        if (this.data.length == 0)
            throw `Matrix is empty.  Cannot take inverse.`;

        let rowCount = this.data.length;
        let colCount = this.data[0].length;

        if (rowCount != colCount)
            throw `Matrix is not a square.  Cannot take inverse.`;

        let identity = [];
        for (let r = 0; r < rowCount; r++) {
            let row = [];
            for (let c = 0; c < colCount; c++) 
                row.push(r == c ? 1 : 0);
            identity.push(row);
        }

        return this.solve(identity);

    }

    // pfister.ee.duke.edu/courses/ecen601/notes_ch8.pdf
    //   - p130 describes how to use the compact for the pseudoinverse
    //   - Just remember that the inverse of 'D' also requires you to
    //   - zero out the non-diagonals, not have them be infinite or und.
    pseudoInverse(
        ...args // passed to decompose('svd.compact')
    ) {
        let svd = this.decomposeSVDcomp(...args);
        let inv = svd.D.apply(x => x == 0 ? 1e32 : x == -0 ? -1e32 : 1/x).diagonal();
        let result = svd.R.multiply(inv).multiply(svd.L.transpose());
        result.colNames = [...this.rowNames];
        result.rowNames = [...this.colNames];
        return result;
    }

    diagonal(
        // True to output a vector.  False to output a 
        // matrix with non-diagonal cells zeroed out.
        asVector = false
    ) {

        if (!this.isSquare())
            throw 'Matrix is not a square.  Cannot get diagonal vector.';
        
        if (asVector) {
            let vector = [];
            for (let i = 0; i < this.data.length; i++)
                vector.push(this.data[i][i]);
            return new matrix(vector, x => [x]);
        }

        let mx = this.clone();
        for (let r = 0; r < mx.data.length; r++)
        for (let c = 0; c < mx.data[r].length; c++)
            if (r != c) 
                mx.data[r][c] = 0;
        return mx;

    }

    round(multiple) {
        let mx = this.clone();
        for(let row of mx.data) 
            for(let c in row) {
                row[c] = round(row[c], multiple);
                if(row[c] == -0)
                    row[c] = 0;
            }
        return mx;
    }

    equals(other, errorThreshold = 0, dataOnly = true) {

        let arrayEq = (a,b,isString) => {
            if (a.length != b.length)
                return false;
            for(let i in a)
                if (!isString && Math.abs(a[i] - b[i]) > errorThreshold)
                    return false;
                else if (isString && a != b)
                    return false;
            return true;
        };
    
        if (this.data.length != other.data.length)
            return false;
        if (this.data.length != 0 && this.data[0].length != other.data[0].length)
            return false;

        for (let r in this.data)
            if (!arrayEq(this.data[r], other.data[r], false))
                return false;

        return dataOnly ? true
            : !arrayEq(this.rowNames, other.rowNames, true) ? false 
            : !arrayEq(this.colNames, other.colNames, true) ? false
            : true;

    }

    // 'Data' is used for recursion.  At the top level, omit it.
    determinant (data) {

        if (data == undefined) { 
            if (this.data.length > 0 && this.data.length != this.data[0].length) 
                throw `Matrix is not a square.  Cannot take the determinant`;
            return this.determinant(this.data);
        }

        if (data.length == 2)
            return data[0][0] * data[1][1] - data[0][1] * data[1][0];
    
        let sum = 0;
        for (let cTop in data[0]) {
            
            let subset = [];
            for(let r = 1; r < data.length; r++) {
                let subrow = [];
                for (let c in data[r]) {
                    if (cTop == c) 
                        continue;
                    subrow.push(data[r][c]);
                }
                subset.push(subrow);
            }
            
            let sign = (cTop % 2 == 0 ? 1 : -1);
            let det = this.determinant(subset);
            sum += sign * data[0][cTop] * det;
        }
    
        return sum;
    
    }

    norm(
        type = 'frobenius' // euclidian|frobenius, 1, infinity 
    ) {
        
        if (isString(type))
            type = type.toLowerCase();

        if (['euclidian', 'frobenius', 'e', 'f'].includes(type)) {
            let ss = 0;
            for (let row of this.data)
            for (let cell of row) 
                ss += Math.pow(cell,2);
            return Math.pow(ss,0.5);
        }

        if(type == 1) {
            let absColSums = [];
            for (let c = 0; c < this.data[0].length; c++) {
                let absColSum = 0;
                for (let row of this.data)
                    absColSum += Math.abs(row[c]);
                absColSums.push(absColSum);
            }
            return Math.max(...absColSums);
        }

        if (type == 'infinity' || type == 'i') {
            let absRowSums = [];
            for (let row of this.data) {
                let absRowSum = 0;
                for (let cell of row)
                    absRowSum += Math.abs(cell);
                absRowSums.push(absRowSum);
            }
            return Math.max(...absRowSums);
        } 

    }

    // online.stat.psu.edu/statprogram/reviews/matrix-algebra/gauss-jordan-elimination
    // Though, to save some logic, I believe I do more steps in sorting than necessary.
    solve(
        other,
        fullyReduce = true,
        returnAllObjects = false
    ) {

        let mx = this.clone();
        other = Array.isArray(other)
            ? new matrix(other)
            : other.clone();

        let leadingItem = (row) => {
            for(let c in row) 
                if (row[c] != 0)
                    return { pos: c, val: row[c] };
            return { pos: -1, val: null }
        };

        let rowMultiply = (row, multiplier) => {
            for(let c in row) 
                row[c] *= multiplier;
            return row;
        };

        let rowAdd = (rowA, rowB) => {
            for(let c in rowA) 
                rowA[c] += rowB[c];
            return rowA;
        };

        let clone = (row) => {
            let result = [];
            for(let cell of row)
                result.push(cell);
            return result;
        };

        let sort = (onOrAfterIndex) => { 

            for(let r = mx.data.length - 2; r >= onOrAfterIndex; r--) {

                let prev = mx.data[r];
                let cur = mx.data[r + 1];
                let prevLeader = leadingItem(prev);
                let curLeader = leadingItem(cur);
                let otherPrev = other[r];
                let otherCur = other[r + 1];

                let needsPromote = 
                    prevLeader.pos > curLeader.pos || 
                    (prevLeader.pos == curLeader.pos && prevLeader.val > curLeader.val);

                if (needsPromote) {
                    mx.data[r + 1] = cur;
                    mx.data[r] = prev;
                    other[r + 1] = otherCur;
                    other[r] = otherPrev;
                }
                
                prevLeader = curLeader;

            }

        };

        let subtractTopMultiple = (onOrAfterIndex) => {
                
            let topLead = leadingItem(mx.data[onOrAfterIndex]);

            rowMultiply(mx.data[onOrAfterIndex], 1 / topLead.val);
            rowMultiply(other[onOrAfterIndex], 1 / topLead.val);

            for(let r = 0; r < mx.data.length; r++) {
                if (r == onOrAfterIndex)
                    continue;
                let row = mx.data[r];
                let counterpart = row[topLead.pos];
                if (counterpart == 0)
                    continue;
                let multipliedRow = rowMultiply(
                    clone(mx.data[onOrAfterIndex]), 
                    -counterpart
                );
                rowAdd(mx.data[r], multipliedRow);
                let multipliedOther = rowMultiply(
                    clone(other[onOrAfterIndex]),
                    -counterpart
                );
                rowAdd(other[r], multipliedOther);
            }

        };

        let initializations = () => {
                
            if (other instanceof matrix)
                other = other.data;
            else if (!Array.isArray(other))
                throw `'other' must be an array or matrix.`;

            if (other.length > 0 && !Array.isArray(other[0])) 
                for(let r in other)
                    other[r] = [other[r]]; 

            other = clone(other);

            if (mx.data.length == 0 || other.length == 0) 
                throw 'cannot solve when either input is empty';

            if (mx.data.length != other.length)
                throw 'cannot solve when input lengths do not match';

        };

        initializations();

        for (let i = 0; i < mx.data.length; i++) {
            sort(i);
            subtractTopMultiple(i);
            if (!fullyReduce && mx.isUpperTriangular()) 
                break;
        }

        if (!returnAllObjects) {
            mx.data = other;
            return mx;
        }

        return {
            A: mx,
            other: new matrix(other)
        }

    }

    decomposeQR() {

        // example: www.cs.nthu.edu.tw/~cherung/teaching/2008cs3331/chap4%20example.pdf
        // properties: en.wikipedia.org/wiki/QR_decomposition

        let R = this.clone();
        let Q;

        let cycle = (level = 0) => {

            if (level >= this.data.length - 1)
                return;
    
            let Rsub = R.clone().filter(ix => ix >= level, ix => ix >= level);
            if (Rsub.data[0].length == 0) 
                throw `QR decomposition did not converge in time to produce an upper triangular R.`;
            let col0 = Rsub.clone().filter(null, 0);
            let e = matrix.identity(Rsub.data.length).filter(null, 0);
            let v = col0.clone().subtract(e.clone().multiply((Math.sign(col0.data[0]) || 1) * col0.norm())); 
            let vvt = v.clone().multiply(v.clone().transpose());

            let H = v.clone().transpose().multiply(v).apply(
                cell => cell == 0 ? 1e-32 : cell == -0 ? -1e-32 : cell
            ).data[0];
            H = 2 / H;
            H = vvt.clone().multiply(H);
            H = matrix.identity(H.data[0].length).subtract(H);
            let I = matrix.identity(H.data[0].length + level);
            for (let r = level; r < I.data.length; r++)
            for (let c = level; c < I.data[0].length; c++) 
                I.data[r][c] = H.data[r-level][c-level];
            H = I;

            R = H.clone().multiply(R);
            Q = Q == null ? H : Q.multiply(H);
       
            let upperSquare = R.clone().filter(ix => ix < R.data[0].length, null);
            let lowerRectangle = R.clone().filter(ix => ix >= R.data[0].length, null);
            let lowerIsZeroes = !lowerRectangle.round(1e-10).data.some(row => row.some(cell => cell != 0));
    
            if (upperSquare.isUpperTriangular(1e-10) && lowerIsZeroes)
                return;
    
            cycle(++level);
    
        };
    
        cycle();
        
        return { 
            A: this, 
            R, 
            Q, 
            test: (multiple = 1e-8) => 
                this.round(multiple).equals(
                    Q.multiply(R).round(multiple)
                )
        };

    }

    // hal.archives-ouvertes.fr/hal-01927616/file/IEEE%20TNNLS.pdf
    // pfister.ee.duke.edu/courses/ecen601/notes_ch8.pdf
    //   - p129 describes the full vs compact SVD (this and R does the compact)
    decomposeSVDcomp(
        errorThreshold = 1e-8, 
        maxIterations = 1000
    ) {

        let m = this.data.length;
        let n = this.data[0].length;
        let r = m < n ? m : n;

        let L = matrix.identity(m,r); 
        let D = matrix.identity(r);
        let R = matrix.identity(r,n);

        // Sometimes singulars come out negative.  But compared to R
        // output, only the sign is off.  So this just corrects that.
        let signCorrect = () => {
            let Id = new matrix.identity(D.data[0].length);
            let Ir = new matrix.identity(R.data[0].length);
            for(let i in D.data)
                if (D.data[i][i] < 0) {
                    Id.data[i][i] = -1;
                    Ir.data[i][i] = -1;
                }
            D = D.multiply(Id);
            R = R.multiply(Ir);
        }; 
    
        let test = () => {
            D = D.filter(id => id < r, id => id < r);
                return L.multiply(D).multiply(R.transpose()).equals(this, errorThreshold) 
            && L.transpose().multiply(L).equals(matrix.identity(L.data[0].length), errorThreshold)
            && R.transpose().multiply(R).equals(matrix.identity(R.data[0].length), errorThreshold)
            && D.isDiagonal(errorThreshold);
        };
    
        let iterations = 0;
        while (++iterations <= maxIterations) {

            L = this
                .multiply(R.transpose())
                .decomposeQR().Q
                .filter(null, ix => ix >= 0 && ix <= r - 1);

            let qr = this.transpose().multiply(L).decomposeQR();
            R = qr.Q.filter(null, ix => ix >= 0 && ix <= r - 1).transpose();
            D = qr.R.transpose();

            if (iterations % 10 == 0) {
                R = R.transpose();
                signCorrect();
                if (test()) 
                    return { A: this, L, D, R, iterations };
                R = R.transpose();
            }
    
        }
    
        R = R.transpose();
        console.log('SVD failed to converge.  Unconverged data follows.');
        throw { 
            message: 'SVD failed to converge.  Unconverged data follows.', 
            showObjects: () => {
                let logMx = (mx, name) => mx.log(null, name, row => round(row, 1e-8));
                console.log('unconverged');
                console.log('iterations:', iterations); 
                logMx(this, 'A'); 
                logMx(L, 'L');
                logMx(D, 'D'); 
                logMx(R, 'R');
            }
        };

    }

    // www-users.cs.umn.edu/~saad/eig_book_2ndEd.pdf (p89)
    eigen (
        thresholds = 1e-8 // or pass an object that looks like 'params' below
    ) {

        // initializations

            let params = {
                valueThreshold: 1e-8,
                valueLoopMax: 1000,
                valueMerge: 1e-3,
                vectorThreshold: 1e-8,
                vectorLoopMax: 1000,
                testThreshold: 1e-6
            };

            if (!isFinite(thresholds))
                Object.assign(params, thresholds);

            params.threshold = isFinite(thresholds) ? thresholds : params.threshold;
            params.valueThreshold = params.threshold || params.valueThreshold;
            params.vectorThreshold = params.threshold || params.vectorThreshold;
            params.valueLoopMax = params.loopMax || params.valueLoopMax;
            params.vectorLoopMax = params.loopMax || params.vectorLoopMax;

            let A = this.clone();

        // calculate eigenvalues

            let eigenValsObj = this._eigen_getVals(
                A, 
                params.valueThreshold, 
                params.valueLoopMax
            );

            let rawValues = eigenValsObj.values.map(v => v);
            let values = eigenValsObj.values;

            // if a multiplicity is detected, average out the multiples
            if (params.valueMerge)
                values = this._eigen_mergeVals(values, params.valueMerge); 

            // Final rounding of eigenvals (one less precision than the stopThreshold).

                // In one case, I've noticed this helps in the vector creation and testing phases 
                // because the rounding can bring the estimates to their exact figure, expecially
                // when the exact figures are integers or otherwise fairlry 'clean' numbers.   

                let [str, precision] = params.valueThreshold.toExponential().split('e');
                let demoted = parseFloat(str + 'e' + (parseInt(precision) + 1).toString());
                values = values.map(v => round(v, demoted));

        // caluclate vectors

            let vectors = [];
            let iterations = {
                values: eigenValsObj.iterations
            };

            for(let v = 0; v < values.length; v++) {
                let eigenVectObj; 
            
                try { 
                    eigenVectObj = this._eigen_getVect(
                        A, 
                        values[v], 
                        params.vectorThreshold, 
                        params.vectorLoopMax
                    );
                }
                catch(err) {
                    if (isString(err))
                        throw err;
                    err.eigenValsObj = eigenValsObj;
                    err.eigenValsObj.about = 
                        'This eigenValsObj represents successfull iteration of eigenvalues.  ' +
                        'It is just for completeness of information.  ' +
                        'It is an iteration for an eigenvector that has failed.  ';
                    throw err;
                }
                vectors.push(eigenVectObj.vector);
                iterations[`vector ${v}`] = eigenVectObj.iterations;
            }

            vectors = new matrix(vectors).transpose();

        // terminations

            // present algorithms already output eigenvalues sorted by dominance
            // and eigenvectors normalized to unit length 1.  However, this 
            // ensures that there is an option to guaranteed that in case there
            // are changes to the implementation that affect this.
            let normalized = this._eigen_sortAndNormalize(values, vectors);
            let nvr = normalized.vectors.rowNames;
            let nvc = normalized.vectors.colNames;
            normalized.vectors.rowNames = nvc;
            normalized.vectors.colNames = nvr;

            let result = {
                A: this,
                values: normalized.values.diagonal(true).transpose().data[0],
                vectors: normalized.vectors,
                rawValues,
                iterations
            };

            if (params.testThreshold && !this._eigen_test(A, values, vectors, params.testThreshold)) {
                console.log({FailingObjects: result});
                throw   `Produced eigen values and vectors did not pass test.  ` +
                        `Failing objects precede. ` +
                        `You may have to increase the 'maxIterationsPerVector', or, more likey, ` +
                        `the 'threshold' or 'roundEigenValues' parameters.  ` +
                        `This is especially true if you have repeated eigenvalues. `;                    
            }

            return result;

    }

    _eigen_sortAndNormalize(
        valuesArray,
        vectors
    ) {

        // Sort in order of dominance.   
        let sortedValues = valuesArray.map((value,ix) => ({ value, ix })).sort((a,b) => 
            Math.abs(a.value) < Math.abs(b.value) ? 1
            : Math.abs(a.value) > Math.abs(b.value) ? -1
            : b.value - a.value
        );

        let values = matrix.identity(valuesArray.length);
        for(let r in values.data)
        for(let c in values.data[r])
            if (r == c)
                values.data[r][c] = sortedValues[r].value;

        let columnsAsArrays = [];
        for(let sorted of sortedValues) {
            let vector = vectors.filter(null, sorted.ix);
            let norm = vector.norm('euclidian');
            vector = vector.multiply(1/norm);  // set to length 1
            let columnAsArray = vector.transpose().data[0];
            columnsAsArrays.push(columnAsArray);
        }
        
        return {
            values,
            vectors: new matrix(columnsAsArrays).transpose()
        }

    }

    // Direct QR method
    _eigen_getVals(
        A, 
        stopThreshold = 1e-8, 
        maxIterations = 1000
    ) {

        A = A.clone();
        let values = A.clone();
        let prev;
        let diag;
    
        let iterations = 0;
        while (iterations++ <= maxIterations) {


            let QR = values.clone().decomposeQR();
            values = QR.R.multiply(QR.Q);
            diag = values.diagonal(true).transpose().data[0];
    
            if (prev) {
                let test = true;
                // convergence with previous test
                for(let i = 0; i < diag.length; i++) 
                    if (Math.abs(diag[i] - prev[i]) > stopThreshold) {
                        test = false;
                        break; 
                    }
                if (test)
                    break; 
            }
            
            if (iterations == maxIterations) {
                let msg = `Eigenvalues did not converge within ${maxIterations} iterations.`;
                console.log(msg, 'Failing objects follow.');
                console.log({
                    iterations, 
                    stopThreshold, 
                    values, 
                    diag, 
                    prev,
                    test: diag.map((d,i) => Math.abs(d - prev[i]))
                });
                throw msg;
            }
    
            prev = diag;
    
        }
        
        values = new matrix([diag]);

        return {
            iterations,
            A,
            values: values.data[0],
            prev
        };
    
    }    

    // citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.149.4934&rep=rep1&type=pdf
    _eigen_getVect (
        A,
        eigenvalue,
        threshold = 1e-12,
        maxIterations = 1000
    ) {

        let n = A.data.length;
        let ei = matrix.identity(n).multiply(eigenvalue);
        let M = A.subtract(ei).pseudoInverse(threshold, maxIterations);

        let value = null;
        let vector = M.data.map(row => 1);
        let prev = M.data.map(row => 1);

        let iterations = 0;
        while(iterations++ <= maxIterations) {

            let y = M.data.map(row => 
                row
                .map((cell,ix) => cell * prev[ix])
                .reduce((a,b) => a + b)
            );

            // I originally tried this with 'value = Math.min(...y)',
            // which is a p-1 norm.  And it works.  And I think any
            // norm will.  But I see most sources using p-2 norm.  
            // For real numbers, this is euclidean distance.  And 
            // it seems to shave off a few iterations.
            value = y.map(_ => Math.pow(_,2));
            value = value.reduce((a,b) => a + b);
            value = Math.pow(value,0.5);

            vector = y.map(_ => _ / value);

            let maxDiff = Math.max(
                ...prev.map((p,ix) => Math.abs(Math.abs(p) - Math.abs(vector[ix])))
            );

            let result = {
                iterations, 
                eigenvalue,
                valueAfterShift: value,
                vector
            };

            if (maxDiff < threshold) 
                return result;        

            // Every once in awhile, a matrix causes non-convergence 
            // but goes back and fourth between two vectors.  They are
            // similar, with a change in sign, but not quite multiples
            // of each other.  And one is correct while the other is
            // incorrect.  Example: [[0,5,-6],[-6,-11,9],[-4,-6,4]].
            // This tests at random iterations to capture the 
            // correct vector in case it's stuck in this.  Can't do 
            // modulus, or at least not an even one, because you might
            // always hit the wrong one. 
            if (Math.random() < 0.01) {
                let test;
                try {
                    test = this._eigen_test(
                        A,
                        [eigenvalue],
                        new matrix([vector]).transpose(),
                        threshold
                    );
                }
                catch (e) {
                    console.log('Failing objects follow.');
                    console.log({
                        val: eigenvalue,
                        vect: new matrix([vector]).transpose()
                    });
                    throw e;
                }
                if (test)
                    return result;
            }

            if (iterations > maxIterations) {
                let message = 
                    `getVect could not converge even after ${iterations} iterations.  ` +
                    `You may have to increase the 'maxIterations' or 'threshold' parameters.  ` +
                    `Most likey the latter.  This is especially true if you have repeated ` +
                    `eigenvalues. `;
                console.log(message);
                result.prev = prev;
                result.maxDiff = maxDiff;
                throw {
                    message,
                    failingObjects: result
                }
            }

            prev = vector.map(x => x);

        }

    }

    _eigen_mergeVals (values, mergeThreshold) {

        let sorted = values.map(v => v).sort((a,b) => 
            a < b ? 1 : a > b ? -1 : 0
        );

        let mults = [];
        let multFound = false;

        for (let v in sorted) {
            if (v == 0 || Math.abs(sorted[v] - sorted[v-1]) > mergeThreshold)   
                mults.push([sorted[v]]);
            else {
                mults[mults.length - 1].push(sorted[v]);  
                multFound = true;
            }
        }
        
        if (multFound) 
            for(let v in values) {
                let mult = mults.find(m => m.some(val => values[v] == val));
                if (mult.length == 1)
                    continue;
                values[v] = mult.reduce((a,b) => a + b, 0) / mult.length; // average
                values[v] = round(values[v], mergeThreshold);
            }            

        return values;

    }

    _eigen_test(origMatrix, values, vectors, errorThreshold) {

        if(values instanceof matrix) 
            values = values.diagonal(true).data;

        if(Array.isArray(vectors))
            vectors = new matrix(vectors);

        for (let i = 0; i < vectors.data[0].length; i++) {
            let getVect = () => vectors.filter(null, i);
            let AV = origMatrix.multiply(getVect());
            let VV = getVect().multiply(values[i]);
            if (!AV.equals(VV, errorThreshold, true))
                return false;
        }

        return true;

    }

    filter(rows, cols) {

        let mx = this.clone();
        let allRows = [...Array(mx.data.length).keys()];
        let allCols = [...Array(mx.data[0].length).keys()];
    
        if (rows === undefined || rows === null)
            rows = allRows;
        if (cols === undefined || cols === null)
            cols = allCols;

        if (rows === allRows && cols === allCols)
            return mx;

        // Turn rows or cols parameters into array form
        // > 1 turns into [1],
        // > [false,true,true,false] turns into [1,2]
        // > [-2,-1] turns into [0,3] for 'row' direction and matrix having 4 rows
        // > (ix,row) => row[0] > ix selects any row where the value of the first cell is greter than the row position  
        let arrayify = (param, direction) => {
    
            // convert int form to int array form
            if (typeof param === 'number') 
                param = [param];
    
            if (isString(param))
                param = [param];

            if (Array.isArray(param) && param.length >= 0) {
                
                // convert boolean form to int array form
                if (typeof param[0] === 'boolean') {

                    if (direction == 'rows' && param.length != mx.data.length) 
                        throw `Bool array passed to 'rows' is length ${param.length} (${mx.data.length} expected)`;
                    else if (direction == 'cols' && param.length != mx.data[0].length)
                        throw `Bool array passed to 'cols' is length ${param.length} (${mx.data[0].length} expected)`;
                    
                    param = param
                        .map((row,ix) => row === true ? ix : undefined)
                        .filter(row => row != undefined);

                }
    
                if (typeof param[0] === 'number') {
    
                    // make sure all numbers are integers
                    param = param.map(row => Math.round(row));
    
                    for(let x of param) 
                        if (Math.abs(x) > (direction == 'rows' ? mx.data.length : mx.data[0].length) - 1) 
                            throw `Index |${x}| passed to '${direction}' is outside the bounds of the matrix.`;

                    // deal with negative numbers
                    let positives = param.filter(x => x >= 0 && !Object.is(x, -0));
                    if (positives.length == 0)  // if only negatives, then make the full range and exclude the negatives
                        param = (direction == 'rows' ? allRows : allCols)
                            .filter(num => !param.includes(-num));
                    else if (positives.length < param.length) // if some positives, then just exclude the negatives
                        param = positives;
    
                }
    
            }
    
            if (isFunction(param)) {
                let _param = [];
                if (direction == 'rows')
                    for(let r = 0; r < mx.data.length; r++)  {
                        if (param(r, mx.data[r]))
                            _param.push(r);
                    }
                else 
                    for(let c = 0; c < mx.data[0].length; c++) {
                        let transposed = [];
                        for(let r = 0; r < mx.data.length; r++)
                            transposed.push(mx.data[r][c]);
                        if(param(c, transposed))
                            _param.push(c);
                    }
                param = _param;
            }
    
            return param;
    
        };
    
        let indexify = (array, names, direction) => {

            for(let i = 0; i < array.length; i++) {
                if (!isString(array[i]))
                    continue;
                if (!names)
                    throw `No names for ${direction} exists in order to match '${array[i]}'`;
                let ix = names.findIndex(item => array[i] == item);
                if (ix == -1)
                    throw `'${array[i]}' cannot be found in the collection of names for ${direction}.`;
                array[i] = ix; 
            }
            return array;
        };

        rows = arrayify(rows, 'rows');
        rows = indexify(rows, mx.rowNames, 'rows');
        cols = arrayify(cols, 'cols');
        cols = indexify(cols, mx.colNames, 'cols');

        let subset = [];
        for(let r of rows) {
            let row = [];
            for (let c of cols)
                row.push(mx.data[r][c]);
            subset.push(row);
        }

        if (mx.rowNames)
            mx.rowNames = rows.map(rix => mx.rowNames[rix]);
        if(mx.colNames)
            mx.colNames = cols.map(cix => mx.colNames[cix]);

        mx.data = subset;
        return mx;

    }

    getCell (row, col) {
        return this.data[row][col];
    }

}

matrix.repeat = function (repeater, numRows, numCols, diagOnly) {
    if (numCols == null)
        numCols = numRows;
    let result = [];
    for (let r = 0; r < numRows; r++) {
        let row = [];
        for (let c = 0; c < numCols; c++) {
            row.push(diagOnly && r != c ? 0 : repeater);
        }
        result.push(row);
    }
    return new matrix(result, row => row);
};

matrix.zeroes = function (numRows, numCols) { return matrix.repeat(0, numRows, numCols, false); };
matrix.ones = function (numRows, numCols) { return matrix.repeat(1, numRows, numCols, false); };
matrix.identity = function (
    numRows, 
    numCols = null // null for numCols = numRows
) { 
    return matrix.repeat(1, numRows, numCols || numRows, true); 
};

matrix.randomizer = class {
    setSize (numRows, numCols) {
        this.numRows = numRows;
        this.numCols = numCols;
        return this;
    }
    setValues(lowVal, highVal, integers = false) {
        this.lowVal = lowVal;
        this.highVal = highVal;
        this.integers = integers;
        return this;
    }
    setStructure (structure) {
        this.structure = structure;
        return this;
    }
    get() {
        let result = [];
        if (this.numRows == 0 || this.numCols == 0)
            return result;
        for (let r = 0; r < this.numRows; r++) {
            let row = [];
            for (let c = 0; c < this.numCols; c++) {
                let val = random(this.lowVal, this.highVal, this.integers);
                row.push(val);
            }
            result.push(row);
        }
        return new matrix(result);
    }
};

class parser {

    // Parse function into argument names and body
    constructor (func) {

        this.parameters = [];
        this.body = "";

        let lr = this.splitLeftAndRight(func);

        this.parameters = 
            lr.left
            .replace(/[()\s]/g, '')
            .split(',');

        this.body =
            lr.right
            .replace(/^\s*\{|\}\s*$/g,'')
            .replace(/^\s*|\s*$/g,'');

    }

    splitLeftAndRight (func) {

        let uncommented = 
            func.toString() 
            .replace(/[/][/].*$/mg,'') // strip single-line comments
            .replace(/[/][*][^/*]*[*][/]/g, ''); // strip multi-line comments  
	
        let arrowIx = uncommented.indexOf('=>');
        let braceIx = uncommented.indexOf('{');	

        if (arrowIx == -1 && braceIx == -1) {
            console.trace();
            throw   `it seems that a non-lambda function 
                    was passed to 'parser'`;
        }

        let splitIx = 
            braceIx == -1 ? arrowIx
            : arrowIx == -1 ? braceIx
            : arrowIx < braceIx ? arrowIx 
            : braceIx;

        let isArrow = splitIx == arrowIx;

        let left = uncommented.slice(0,splitIx);
        let right = uncommented.slice(splitIx);

        if(isArrow)
            right = right.slice(2); // get rid of the arrow
        else {
            let parenIx = left.indexOf('(');
            left = left.slice(parenIx);
        }
        
        return { left, right };

    }

}

parser.parse = function (func) {
    return new parser(func);
};

parser.parameters = function(func) {
    return new parser(func).parameters;
};

// Converts (v,w) => v.a = w.a && v.b == w.b 
// into v => { x0 = v.a, x1 = v.b }
// and w => { x0 = w.a, x1 = w.b }
parser.pairEqualitiesToObjectSelectors = function(func) {

    let parsed = new parser(func);
    let leftParam = parsed.parameters[0];
    let rightParam = parsed.parameters[1];
    let leftEqualities = [];
    let rightEqualities = [];
    let splitBodyByAnds = parsed.body.split(/&&|&/);

    for (let aix in splitBodyByAnds) {

        let andPart = splitBodyByAnds[aix];
        let eqParts = andPart.split(/===|==|=/);
        let leftEq;
        let rightEq;

        if (eqParts.length != 2)
            return;

        for (let eix in eqParts) {

            let ep = eqParts[eix].trim();

            if (/[^A-Za-z0-9_. ]/.test(ep)) 
                return;

            if (ep.startsWith(`${leftParam}.`) || ep == leftParam)
                leftEq = ep;
            else if (ep.startsWith(`${rightParam}.`) || ep == rightParam)
                rightEq = ep;
            else
                return; 

        }	    

        leftEqualities[aix] = `x${aix}: ${leftEq}`;
        rightEqualities[aix] = `x${aix}: ${rightEq}`;

    }

    return {
        leftFunc: new Function(leftParam, `return { ${leftEqualities.join(', ')} };`),
        rightFunc: new Function(rightParam, `return { ${rightEqualities.join(', ')} };`)
    };

};

class hashBuckets extends Map {
    
    constructor (
        hashKeySelector,
        distinct = false
    ) {
        super();
        this.distinct = distinct;
        this.hashKeySelector = hashKeySelector;
    }  
 
    addItems(items) {
        for(let item of items)
            this.addItem(item);
        return this;
    }

    addItem(item) {

        let key = this.hashKeySelector(item);
        key = JSON.stringify(key);

        if (this.distinct) {
            this.set(key, [item]);
            return this;
        }

        if(!this.has(key)) 
            this.set(key, []);

        this.get(key).push(item);

        return this;

    }

    getBucket(
        objectToHash, 
        hashKeySelector
    ) {
        let key = hashKeySelector(objectToHash);
        key =JSON.stringify(key);
        return this.get(key);
    }

    getBuckets() {
        return Array.from(this.values());
    }

    * crossMapRow(incomingRow, hashKeySelector, mapper) {

        let existingRows = this.getBucket(incomingRow, hashKeySelector);                

        if (existingRows === undefined)
            existingRows = [undefined];

        for(let existingRow of existingRows) {

            let mapped = mapper(existingRow, incomingRow);

            if (Array.isArray(mapped)) {
                for (let entry of mapped) 
                    if (entry !== undefined) 
                        yield entry;
            }
                        
            else if (mapped !== undefined) 
                yield mapped;

        }

    }
    
}

function* hashMerge (
    leftData, 
    rightData, 
    matcher,
    mapper,
    leftHasher,
    rightHasher,
    leftSingular,
    rightSingular
) {

    let leftBuckets = new hashBuckets(leftHasher, leftSingular).addItems(leftData);
    let rightBuckets = new hashBuckets(rightHasher, rightSingular).addItems(rightData);

    // convenience function for extracting a bucket
    let removeBucket = (buckets, key) => {
        let bucket = buckets.get(key);
        buckets.delete(key);
        return bucket;
    };

    // yield matches and left unmatched
    for(let key of leftBuckets.keys()) 
        yield* loopMerge(
            removeBucket(leftBuckets, key), 
            removeBucket(rightBuckets, key) || [undefined], 
            matcher, 
            mapper
        );

    // yield right unmatched
    for(let key of rightBuckets.keys()) 
        for(let rightItem of removeBucket(rightBuckets, key)) 
            yield* yieldMapped(mapper(undefined, rightItem));

}

function* loopMerge (
    leftData, 
    rightData,
    matcher,
    mapper
) {

    let leftHits = new Set();
    let rightHits = new Set();

    for (let l in leftData)
    for (let r in rightData) {
        if (leftData[l] == undefined || rightData[r] == undefined)
            continue;
        if (matcher(leftData[l], rightData[r])) {
            leftHits.add(l);
            rightHits.add(r);
            yield* yieldMapped(mapper(leftData[l], rightData[r]));
        }
    }

    for (let l in leftData) 
        if (!leftHits.has(l))
            yield* yieldMapped(mapper(leftData[l], undefined));

    for (let r in rightData) 
        if (!rightHits.has(r))
            yield* yieldMapped(mapper(undefined, rightData[r]));

}

function* yieldMapped (mapped) {
    if (!mapped)
        return;
    if (mapped[Symbol.iterator]) 
        yield* mapped;
    else if (mapped)
        yield mapped;
}

class grouping {

    constructor(key) {
        this.key = key;
        this.parent = null;
        this.children = [];
        this.data = null;
        this.dataIsNaked = false;
    }

    *[Symbol.iterator]() { 
        yield* this.data;
    }

    apply (tableLevelFunc) {

        if (this.dataIsNaked) {
            this.group();
            this.apply(tableLevelFunc);
            this.ungroup();
            return;
        }

        if (this.data != null) {
            this.data = (function*(data) { yield* tableLevelFunc(data); })(this.data); 
            return;
        }

        for(let child of this.children)
            child.apply(tableLevelFunc);

    }

    group (hashFunc) {

        if (this.dataIsNaked) {
            this.data = [this.data];
            this.dataIsNaked = false;
            console.warn(
                'hashFunc is ignored when calling .group()' + 
                'if data is a naked object'
            );
            return;
        }

        if (this.data != null) {
            for(let [key,bucket] of new hashBuckets(hashFunc).addItems([...this.data])) {
                let g = new grouping(JSON.parse(key));
                g.parent = this;
                g.data = bucket;
                this.data = null;
                this.children.push(g);
            }
            return;
        }

        for(let child of this.children)
            child.group(hashFunc);

    }

    ungroup () {

        if (this.children.length == 0 && this.parent == null) {
            let nextVal = this.data.next().value;
            if (!this.data.next().done) 
                throw `calling ungroup on a grouping with no parent ` +
                    `and more than one item in data is not permitted.`
            this.data = nextVal;
            this.dataIsNaked = true;
            return 'there is no parent so you should never see this';
        }
  
        if (this.children.length == 0) {
            if (this.parent.data == null)
                this.parent.data = [];
            this.parent.data.push(...this.data);
            return 'removeFromParent';
        }
        
        for(let ch = this.children.length - 1; ch >= 0; ch--) {
            let child = this.children[ch];
            let decision = child.ungroup();
            if (decision == 'removeFromParent')
                this.children.splice(ch,1);
        }

        return 'doNotRemoveFromParent';

    }

    // TODO: work with grouping.data = non-iterable-object
    log (
        element = null, 
        caption = null,
        mapper = x => x, 
        limit = 50
    ) {

        let data = isIterable(this.data) ? [...this.data] : this.data;
        let stringified;
        
        // if param 3 is a number, the use it as a round multiple
        let _mapper = !isNaN(mapper) ? row => round(row, mapper) : mapper;

        caption = 
            this.parent === null && caption ? `${caption}`
            : this.parent !== null ? `key: ${JSON.stringify(this.key)}`
            : ``;

        if (this.children.length == 0) 
            stringified = !isIterable(data)
                ? caption + JSON.stringify(data,null,2).replace(/"([^"]+)":/g, '$1:') // stackoverflow.com/q/11233498
                : tableToString(data, caption, _mapper, limit, true);

        else {
            let stringifieds = this.children.map(child => child.log(element, caption, _mapper, limit)); 
            stringified = tableToString(stringifieds, caption, x => x, limit, false);
        }

        if (this.parent !== null) 
            return { stringified };
        else if (!element) 
            console.log(stringified);
        else {
            let div = document.createElement('div');
            div.style = 'white-space:pre; font-family:consolas; font-size:x-small';
            div.innerHTML = stringified;
            document.querySelector(element).appendChild(div);
        }

        this.data = data;
        return this;

    }    

    arrayify () {

        let list = [];
        list.key = JSON.stringify(this.key);

        if (this.dataIsNaked)
            return this.data;
        else if (this.data != null) 
            list.push(...this.data);

        for(let child of this.children)
            list.push(child.arrayify());

        return list;

    }

}

grouping.groupify = (arrayified, _parent) => {

    let grp = new grouping(arrayified.key ? JSON.parse(arrayified.key) : null);
    grp.parent = _parent || null;

    for(let row of arrayified) 
        if (Array.isArray(row)) {
            grp.children == grp.children || [];
            grp.children.push(grouping.groupify(row, grp));
        }
        else 
            grp.data = (function*() { yield* arrayified; })();

    return grp;

};

class dataset extends grouping {

    constructor(data) {
        super(null);
        this.data = data;
    }

    map (func) {    
        this.apply(function* (data) {
            for(let row of data)
                yield noUndefined(func(row));
        });
        return this;
    }

    filter (func) { 
        this.apply(function* (data) {
            for(let row of data)
                if(func(row))
                    yield row;
        });
        return this;
    }

    sort (sorter) {
        let _sorter = parser.parameters(sorter).length > 1 
            ? data => quickSort(data, sorter, false)
            : data => quickSort(data, sorter, true);
        this.apply(_sorter);
        return this;
    } 

    reduce (obj, ungroup = true) {

        let isNaked = Object.keys(obj).length == 0;
        obj = dotsToProps(obj);

        // wrap result in array to bring back to original nesting level
        this.apply(data => {

            // initializations
            let aggs = {};
            let _data = [...data];
            if (isNaked)
                obj = { naked: obj };

            // perform the aggregations
            for(let [key,reducer] of Object.entries(obj)) {

                let nparams = parser.parameters(reducer).length;
                let seed = reducer.seed === undefined ? 0 : reducer.seed;

                // reducer is meant to apply to entire set of data
                if (nparams == 1)
                    aggs[key] = reducer(_data);

                // reducer is meant to apply to 'accum' and 'next'
                else if (nparams == 2) {
                    let agg = seed;
                    for (let row of _data)
                        agg = reducer(agg, row);
                    aggs[key] = agg;
                }

            }

            // terminations
            if (isNaked)
                aggs = aggs.naked;
            return [aggs]; 

        });

        if (ungroup) 
            this.ungroup();

        return this;

    }

    window ({
        group, 
        sort, 
        filter,
        scroll,
        reduce, 
    } = {}) {
        
        if (group)  this.group(group);
        if (sort)   this.sort(sort);
        if (filter) this.group(filter); 
            // otherwise, you'd have to also 
            // explicitly group by any filtering 

        this.apply(function*(data) {

            let _data = [...data];
            let filtered = filter ? _data.filter(filter) : _data;            
            let aggs = !scroll ? new dataset(filtered).reduce(reduce).get() : {};
            
            // group did not pass the filter
            if (filtered.length == 0) 
                for(let key of Object.keys(aggs))
                    aggs[key] = null;

            for(let currentIx = 0; currentIx < _data.length; currentIx++) {

                if (scroll && filtered.length > 0) {
                    let scrolled = filtered.filter(
                        (row,compareIx) => scroll(currentIx,compareIx)
                    );                
                    aggs = new dataset(scrolled).reduce(reduce).get();
                }

                yield Object.assign(_data[currentIx], aggs);

            }

        });

        if (group)  this.ungroup();
        if (filter) this.ungroup();

        return this;

    }

    standardize(obj, isSample = false) {

        // If obj is string, convert it to object of 
        // functions returning keys.
        if (isString(obj)) {
            let _obj = {};
            for(let key of obj.split(','))
                _obj[key.trim()] = (row) => row[key.trim()];
            obj = _obj;
        }
      
        this.apply(_data => {
                
            let data = [..._data];

            for (let key of Object.keys(obj)) {

                let isNum = (val) => val || val === 0; 

                // Row prop is user function result. 
                // Calculate average.
                let sum = 0;
                let n = 0;
                for (let row of data) { 
                    let val = obj[key](row);
                    if (isNum(val)) {
                        row[key] = val;
                        sum += val;
                        n += 1;
                    }
                }
                let avg = sum / n;

                // row prop is now deviations
                for (let row of data)
                    if (isNum(row[key]))
                        row[key] = row[key] - avg;

                // standard deviation
                let ssd = 0;
                for (let row of data) 
                    if (isNum(row[key]))
                        ssd += Math.pow(row[key],2);
                if (isSample)
                    n--;
                let std = Math.pow(ssd/n, 0.5);

                // row prop is now z scores
                for (let row of data)
                    if (isNum(row[key]))
                        row[key] /= std;

            }

            return data;

        });

        return this;

    }

    distinct (hashKeySelector, sorter) {

        hashKeySelector = hashKeySelector || (x => x);
        
        let getFirstBucketItem = sorter
            ? (bucket) => new dataset(bucket).sort(sorter).data.next().value
            : (bucket) => bucket[0];
            

        this.apply(data => 
            new hashBuckets(hashKeySelector)
                .addItems(data)
                .getBuckets()
                .map(getFirstBucketItem)
        );

        return this;

    }

    merge (
        rightData, 
        matcher, 
        mapper, 
        {
            singular, 
            leftSingular,
            rightSingular,
            hasher,
            leftHasher,
            rightHasher,
            algo
        } = {}
    ) {

        // initializations

            rightData = rightData instanceof dataset ? rightData.data : rightData;
            leftHasher = leftHasher || hasher || rightHasher;
            rightHasher = rightHasher || hasher || leftHasher;
            leftSingular = leftSingular || singular || false;
            rightSingular = rightSingular || singular || false;
            matcher = matcher == '=' ? (l,r) => eq(l,r) : matcher || ((l,r) => true);

            if (!['hash', 'loop'].includes(algo) && algo != undefined) 
                throw `algo '${algo}' is not recognized.  Pass 'hash', 'loop', or undefined.`;

        // try to parse the matcher into hashers

            if (!leftHasher && !rightHasher && algo != 'loop') {
                let parsedHashers = parser.pairEqualitiesToObjectSelectors(matcher);
                if (parsedHashers) {
                    leftHasher = parsedHashers.leftFunc;
                    rightHasher = parsedHashers.rightFunc;
                }
            }

        // final validations

            if (algo == 'hash' && !leftHasher && !rightHasher)
                throw   `Must loop merge.  "${matcher}" could not be parsed` + 
                        `into functions that return objects for hashing.`;

        // terminations

            let mergeFunc = leftHasher && rightHasher
                ? data => [...hashMerge( 
                        data, rightData, 
                        matcher, mapper, 
                        leftHasher, rightHasher, 
                        leftSingular, rightSingular
                    )]
                : data => [...loopMerge(
                        data, rightData, 
                        matcher, mapper
                    )];

            this.apply(mergeFunc); 
            return this;

    }

    join(rightData, matcher, mergeOptions = {}) {
        let mapper = (l,r) => l&&r ? {...l,...r} : undefined;
        return this.merge(rightData, matcher, mapper, mergeOptions);
    }
    joinLeft(rightData, matcher, mergeOptions = {}) {
        let mapper = (l,r) => l&&r ? {...l,...r} : l;
        return this.merge(rightData, matcher, mapper, mergeOptions);
    }
    joinRight(rightData, matcher, mergeOptions = {}) {
        let mapper = (l,r) => l&&r ? {...l,...r} : r;
        return this.merge(rightData, matcher, mapper, mergeOptions);
    }
    joinFull(rightData, matcher, mergeOptions = {}) {
        let mapper = (l,r) => (l&&r ? {...l, ...r} : l||r);
        return this.merge(rightData, matcher, mapper, mergeOptions);
    }

    exists(rightData, matcher, mergeOptions = { leftSingular: false, rightSingular: true }) {
        let mapper = (l,r) => l&&r ? l : undefined;
        return this.merge(rightData, matcher, mapper, mergeOptions);
    }
    notExists(rightData, matcher, mergeOptions = {}) {
        let mapper = (l,r) => l&&r ? undefined : l;
        return this.merge(rightData, matcher, mapper, mergeOptions);
    }
    notExistsFull(rightData, matcher, mergeOptions = {}) {
        let mapper = (l,r) => l&&r ? undefined : l||r;
        return this.merge(rightData, matcher, mapper, mergeOptions);
    }

    // TODO: Consider the following types:
    //   noij[left|right|both|inner]
    //   joinStack 
    //   unionAll/insert
    //   except
    //   update
    //   scd

    matrix(        
        selector, // csv of prop names or func returning array of numbers
        rowNames // string of a prop name or func identifiying the property representing the name
    ) {
        return new matrix(this.data, selector, rowNames);
    }

    group (func) {
        super.group(func);
        return this;
    }

    ungroup (mapper) {
        if (mapper)
            this.map(mapper);
        super.ungroup();
        return this;
    }

    get (mapper = null) {
        if (mapper)
            this.map(mapper);
        return this.arrayify();
    }

    toJsonString(replacer, space) {
        let getted = this.get();
        return JSON.stringify(getted, replacer, space);
    }

}

dataset.fromJson = function(json) {

    let groupify = (arrayified) => {
        let parsed = isString(arrayified) 
            ? JSON.parse(arrayified) 
            : arrayified;
        let groupified = grouping.groupify(parsed);
        let ds = new dataset();
        ds.data = groupified.data;
        return ds;
    };

    return json.constructor.name == 'Response' 
        ? json.json().then(groupify)
        : groupify(json);

};

function first(rowFunc) { 
    return data => {
        for (let row of data)
            if (rowFunc(row) !== undefined && rowFunc(row) !== null)
                return rowFunc(row);
        return null;
    }
}
function last (rowFunc) {
    return data => {
        let last = null;
        for (let row of data) {
            let val = rowFunc(row);
            if (val !== undefined && val !== null)
                last = val;
        }
        return last;
    }
}

function sum(rowFunc) { 
    return data => {
        let agg = 0;
        for (let row of data) 
            agg += rowFunc(row);
        return agg;
    }
}

function count(rowFunc) { 
    return data => {

        let agg = 0;
        for (let row of data) {
            let r = rowFunc(row);
            if (r !== undefined && r !== null)
                agg += 1;
        }
        return agg;
    }
}

function avg(rowFunc) { 
    return data => {

        let s = sum(rowFunc)(data);
        let n = count(rowFunc)(data);
        return s / n;
    }
}

function std(rowFunc, isSample = false) { 
    return data => {
        let m = avg(rowFunc)(data);
        let ssd = data.reduce((agg,row) => agg + Math.pow(rowFunc(row) - m,2), 0);
        let n = count(rowFunc)(data);
        if (isSample)
            n--;
        return Math.pow(ssd/n, 0.5);
    }
}

function mad(rowFunc) { 
    return data => {

        let avg = this.avg(rowFunc)(data);
        let devs = [];

        for (let ix in data)
            devs[ix] = Math.abs(rowFunc(data[ix]) - avg);
    
        return this.avg(x => x)(devs);    

    }
}

function cor(rowFunc, options) {
    return data => {
    
        let xAvg = avg(v => rowFunc(v)[0])(data);
        let yAvg = avg(v => rowFunc(v)[1])(data);
        let n = count(v => rowFunc(v))(data);

        let diffs = [];
        for(let row of data) 
            diffs.push({ 
                xDiff: rowFunc(row)[0] - xAvg, 
                yDiff: rowFunc(row)[1] - yAvg
            });

        let xyDiff = sum(row => row.xDiff * row.yDiff)(diffs);
        let xDiffSq = sum(row => row.xDiff ** 2)(diffs);
        let yDiffSq = sum(row => row.yDiff ** 2)(diffs);

        let cor = xyDiff / (xDiffSq ** 0.5 * yDiffSq ** 0.5);
        let df = n - 2;
        let t =  studentsTfromCor(cor, n);
        let pVal = studentsTcdf(t, df);
            
        if (options === undefined)
            return cor;

        if (options.tails == 2)
            pVal *= 2;

        return { cor, pVal, n, df, t };
        
    }
}

function  covMatrix (selector, isSample = false) {
    return data => {

        // stattrek.com/matrix-algebra/covariance-matrix.aspx

        let asMatrix = new dataset(data).matrix(selector);

        let result = // result is averages
            matrix.ones(asMatrix.data.length)
            .multiply(asMatrix)
            .multiply(1/asMatrix.data.length); 

        result = asMatrix.apply(result, (a,b) => a - b); // result is deviations
        result = result.transpose().multiply(result); // result is squared deviations        
        return result.multiply(1/(asMatrix.data.length - (isSample ? 1 : 0)));

    }
}

// No need for 'isSample' as with covMatrix, because 
// the results are the same for a sample vs a population.
function corMatrix(selector) {
    return data => {
        // math.stackexchange.com/questions/186959/correlation-matrix-from-covariance-matrix/300775
        let cov = covMatrix(selector)(data);
        let STDs = cov.diagonal().apply(x => Math.pow(x,0.5));
        return STDs.inverse().multiply(cov).multiply(STDs.inverse());
    }
}

function dimReduce (
    explicitVars, 
    {
        eigenArgs = {}, // empty object for defaults in initializations
        maxDims = null, // null for no max
        minEigenVal = 1, // null for no threshold
        rotationMaxIterations = 1000,
        rotationAngleThreshold = 1e-8,
        attachData = false
    } = {}
) { return data => {
  
    // Initializations

        eigenArgs.valueThreshold  = eigenArgs.valueThreshold || 1e-12;
        eigenArgs.vectorThreshold = eigenArgs.vectorThreshold || 1e-4;
        eigenArgs.testThreshold = eigenArgs.testThreshold || 1e-3;

    // Calculate the correlations and get the dimensions

        let correlations = 
            new dataset(data)
            .reduce(corMatrix(explicitVars))
            .data;
        
        let eigen = correlations.eigen(eigenArgs);    

    // Produce the loadings
  
        let loadings = [] ;
        for (let i = 0; i < eigen.values.length; i++) {
            if (maxDims && i > maxDims) 
                continue;
            else if (minEigenVal && eigen.values[i] < minEigenVal)
                continue;

            let loading = 
                eigen.vectors.filter(null, i)
                .multiply(Math.pow(eigen.values[i],0.5))
                .transpose()
                .data[0]; // it's a vector, just get it
            loadings.push(loading); 
        }
        loadings = new matrix(loadings).transpose();
        loadings.rowNames = correlations.rowNames;
        loadings.colNames = loadings.colNames.map((cn,ix) => `dim${ix}`);

        let unrotated = _dimReduce_wrapLoadings(loadings);

    // 'Normalize' the loadings in preparation for rotation
        
        let comRoots = unrotated.communalities.apply(cell => Math.pow(cell, 0.5));
        loadings = loadings.clone();

        for(let c = 0; c < loadings.nCol; c++)
        for(let r = 0; r < loadings.nRow; r++) 
            loadings.data[r][c] = loadings.data[r][c] / comRoots.data[r][0];    

    // Rotate 
        
        let iterations = 0;
        let maxAngle = null;
        let mxSum = (matrix) => matrix.reduce('all', (a,b)=>a+b).data[0][0];
        let mxCellMult = (mxA, mxB) => mxA.apply(mxB, (a,b) => a*b);
        let mxSquare = (matrix) => matrix.apply(cell => cell*cell);

        while (
            iterations++ < rotationMaxIterations 
            && (maxAngle > rotationAngleThreshold || maxAngle == null)
        ) {
        
            maxAngle = null;

            for(let leftCol = 0; leftCol < loadings.nCol - 1; leftCol++)
            for(let rightCol = 1; rightCol < loadings.nCol; rightCol++) {
        
                let subset = 
                    loadings.filter(null,leftCol)
                    .appendCols(loadings.filter(null,rightCol));
                        
                let U = mxSquare(subset.filter(null,0)).subtract(mxSquare(subset.filter(null,1)));
                let V = mxCellMult(subset.filter(null,0), subset.filter(null,1)).multiply(2);

                let num = 2 * (loadings.nRow * mxSum(mxCellMult(U,V)) - mxSum(U) * mxSum(V));
                let den = loadings.nRow 
                    * mxSum(mxSquare(U).subtract(mxSquare(V))) 
                    - (Math.pow(mxSum(U),2) - Math.pow(mxSum(V),2));
                let angle = 0.25 * Math.atan(num/den);
                
                if(angle > maxAngle || maxAngle == null)
                    maxAngle = angle;
        
                let rotator = new matrix([
                    [Math.cos(angle), -Math.sin(angle)],
                    [Math.sin(angle), Math.cos(angle)]
                ]);
                subset = subset.multiply(rotator);

                for(let r = 0; r < loadings.nRow; r++) {
                    loadings.data[r][leftCol] = subset.data[r][0];
                    loadings.data[r][rightCol] = subset.data[r][1];
                }

            }
                
        }

    // undo the normalization 

        for(let c = 0; c < loadings.nCol; c++)
        for(let r = 0; r < loadings.nRow; r++) 
            loadings.data[r][c] = loadings.data[r][c] * comRoots.data[r][0];        

        let rotated = _dimReduce_wrapLoadings(loadings);

    // terminations

        let results = {
            rotated,
            unrotated,
            eigenValues: eigen.values,
            correlations
        };

        if (attachData)
            results.data = _dimReduce_scoreTheData(data, explicitVars, correlations, rotated.loadings);

        results.log = (element, masterCaption, roundMultiple) => {

            let rounder = roundMultiple !== undefined ? (row) => round(row,roundMultiple) : x => x;
            
            if (masterCaption) 
                console.log(`-----------------------------------\r\n${masterCaption}`);

            console.log('\r\n\r\n' + 
                'For guidance on how to query dimResults, ' + 
                'call "dimResults.help" on the fluent-data object, ' + 
                'or see the github wiki for this project'
            );

            rotated.log(element, '\r\nrotated:', rounder);
            unrotated.log(element, '\r\nunrotated:', rounder);
            console.log('\r\neigenValues:', rounder ? eigen.values : eigen.values.map(rounder));
            correlations.log(element, '\r\ncorrelations:', rounder);
            
            if (attachData)
                console.log(
                    '\r\n\r\nNote: Data has been output with dimScores attached.  ' +
                    'Query "data" on the return object to get it.  '
                );

            if (masterCaption)
                console.log(`-----------------------------------`);

        };

        return results;

}}

dimReduce.help = `

    dimReduce returns an object with the following properties:
    
        - rotated: rotated dimension properties { loadings, communalities, sums, sumSqs, 
          props, log }.  'log' is a printer that outputs these in a single table.
        - unrotated: unrotated dimension properties (same structure as above).
        - eigenValues: an array of the full set of dimensions output from the correlation matrix
        - correlations: a matrix of the correlation matrix 
        - data: if attachData = true, then the original data with dim scores appended
        - log: a method to display the output described above in friendly form

    See the github 'built-in reducers' wiki page for this library for more information.  

`;

function _dimReduce_scoreTheData (data, explicitVars, correlations, loadings) {

    let corInv = correlations.pseudoInverse();
    let zs = new matrix([...new dataset(data).standardize(explicitVars).data], explicitVars);

    let l_by_cor = loadings.transpose().multiply(corInv);
    
    for(let r = 0; r < zs.nRow; r++) {
         let scores = l_by_cor.multiply(zs.filter(r).transpose()).transpose();
         for(let dim = 0; dim < scores.nCol; dim++)
            data[r][`dim${dim}`] = scores.data[0][dim];
    }

    return new dataset(data);

}

function _dimReduce_wrapLoadings (loads) {

    let communalities = loads
        .apply(cell => cell*cell)
        .reduce('row', (a,b) => a + b)
        .setColNames('communality');
    
    let specificVars = communalities
        .apply(cell => 1-cell)
        .setColNames('specificVar');
    
    let sumSqs = loads
        .apply(cell => cell*cell)
        .reduce('col', (a,b) => a + b)
        .setRowNames('sumSqs');

    let sumCom = communalities.reduce('all', (a,b) => a + b).getCell(0,0);

    let sums = Array(loads.nCol).fill(null);
    sums.push(...[
        communalities.reduce('all', (a,b) => a + b).getCell(0,0),
        specificVars.reduce('all', (a,b) => a + b).getCell(0,0)
    ]);
    sums = new matrix([sums]).setRowNames('sums');
    
    let props = sumSqs
        .apply(sumSq => sumSq / sumCom)
        .setRowNames('propVars');

    let printable = loads
        .appendCols(communalities)
        .appendCols(specificVars)
        .appendRows(sums)
        .appendRows(sumSqs)
        .appendRows(props);

    let log = (element, title, mapper) => printable.log(
        element, 
        title, 
        mapper,
        50,
        {
            headers: true,
            preferEmptyStrings: true,
            bordersBefore: [[loads.nRow],[loads.nCol]]
        }
    ); 

    return {
        loadings: loads,
        communalities,
        sums,
        sumSqs,
        props,
        log
    };

}

function regress (
    ivSelector, 
    dvSelector, 
    {
        attachData = false,
        ci = null
    } = {}
) { return data => {

    // Initializations

        let [ ivKeys, outerIvSelector ] = _regress_processSelector(ivSelector);
        let [ dvKeys, outerDvSelector ] = _regress_processSelector(dvSelector);

        if (ivKeys.length == 0)
            throw `ivSelector must return an object with explicit keys defined.`
        if (dvKeys.length != 1)
            throw `dvSelector must return an object with exactly one key defined.`

        let ivs = 
            new matrix(data, row => [1, ...outerIvSelector(row)] )
            .setColNames(`intercept,${ivKeys.join(',')}`);
            
        let dvs = new matrix(data, row => outerDvSelector(row));

        let n = data.length;
        let transposedIvs = ivs.transpose();

        // I think this translates to variances.
        let variances = transposedIvs.multiply(ivs).inverse();
        
    // Calcaulate the coefficients
                    
        let coefficients = 
            variances
            .multiply(transposedIvs)
            .multiply(dvs);

        coefficients = coefficients.data.map((row,ix) => ({ 
            name: coefficients.rowNames[ix], 
            value: row[0]
        }));
    
    // Calculate the row estimates and residuals

        for(let row of data)  {

            let actual = outerDvSelector(row);
            actual = actual.length == 1 ? actual[0] : undefined;
            
            let estimate =  
                outerIvSelector(row)
                .map((iv,ivIx) => iv * coefficients[ivIx + 1].value)
                .reduce((a,b) => a + b, 0)
                + coefficients[0].value; // intercept
            
            row.estimate = estimate;
            row.actual = actual;
            row.residual = actual - estimate;

        }

    // Calculate the coefficient statistics

        // kokminglee.125mb.com/math/linearreg3.html

        let s = Math.pow(
            (1 / (n - coefficients.length)) 
            * sum(row => Math.pow(row.estimate - row.actual, 2))(data),
            0.5
        );

        let stdErrs = 
            variances
            .multiply(Math.pow(s,2))
            .apply(cell => Math.pow(cell,0.5))
            .diagonal(true)
            .data;
        
        for(let c in coefficients) {
            coefficients[c].stdErr = stdErrs[c];
            coefficients[c].t = coefficients[c].value / stdErrs[c];
            coefficients[c].df = data.length - coefficients.length;
            coefficients[c].pVal = studentsTcdf(coefficients[c].t, coefficients[c].df) * 2;
            coefficients[c].ci = (quantile) => [
                coefficients[c].value + studentsTquantile((1 - quantile)/2, coefficients[c].df) * coefficients[c].stdErr,
                coefficients[c].value - studentsTquantile((1 - quantile)/2, coefficients[c].df) * coefficients[c].stdErr
            ]; 
            if (ci) // If the user passed ci, process the ci function.
                coefficients[c].ci = coefficients[c].ci(ci);
        }

    // Calculate the model-level statistics

        // en.wikipedia.org/wiki/F-test (Regression Problems | p1 and p2 include the intercept)
        let mean = avg(row => row.actual)(data);
        let ssComplex = sum(row => Math.pow(row.estimate - row.actual, 2))(data);
        let ssSimple = sum(row => Math.pow(row.actual - mean, 2))(data);
        let paramsComplex = coefficients.length;
        let paramsSimple = 1;

        let F = ((ssSimple - ssComplex) / (paramsComplex - paramsSimple)) / 
                (ssComplex/(n-paramsComplex));

        let rSquared = 1 - ssComplex / ssSimple; 

        // n - p - 1 = n - coefficients.length becasue p does not include the intercept
        let rSquaredAdj = 1 - (1 - rSquared) * (n - 1) / (n - coefficients.length); 

    // Regress the squared residuals

        // youtube.com/watch?v=wzLADO24CDk

        let breuchPagan;
        let breuchPaganPval;

        if (attachData) {

            // We'll need to save these because rerunning regress will 
            // overwrite the properties.  But we need the original values
            // back in the final output.
            let clonedProps = data.map(row => ({
                actual: row.actual, 
                estimate: row.estimate, 
                residual: row.residual
            }));

            let residRegress = regress(
                ivSelector, 
                'resSq', 
                { estimates: false } // block estimtes to avoid infinite recursion.
            )(
                data.map(row => ({...row, resSq: Math.pow(row.residual,2)}))
            );

            let r2 = residRegress.model.rSquared;
            let p = residRegress.coefficients.length - 1; // seems intercept doesn't count here.
            breuchPagan = r2 * n;
            breuchPaganPval = chiCdf(breuchPagan, p);

            // Restore the original values.
            for(let rowIx in data)  {
                data[rowIx].actual = clonedProps[rowIx].actual;
                data[rowIx].estimate = clonedProps[rowIx].estimate;
                data[rowIx].residual = clonedProps[rowIx].residual;
            }
                

        }

    // Terminations
        
        let results = {
            coefficients,
            model: {
                rSquared,
                rSquaredAdj,
                F,
                pVal: Fcdf(F, paramsComplex - paramsSimple, n - paramsComplex)
            }
        }; 

        if (attachData)
            results.data = new dataset(data);

        if (breuchPagan != undefined) 
            Object.assign(results.model, {breuchPagan, breuchPaganPval});

        results.log = (element, masterCaption, roundMultiple) => {

            let rounder = (x) => !roundMultiple ? x : round(x, roundMultiple);

            if (masterCaption) 
                console.log(`-----------------------------------\r\n${masterCaption}`);

            console.log('\r\n\r\n' + 
                'For guidance on how to query regress, ' + 
                'call "regress.help" on the fluent-data object, ' + 
                'or see the github wiki for this project'
            );

            new dataset(results.coefficients).log(element, '\r\ncoefficients:', rounder);
            
            console.log(
                '\r\nmodel:', 
                JSON.stringify(rounder(results.model),null,2).replace(/"/g,'')
            );

            if (results.data)
                console.log(
                    '\r\n\r\nNote: Data has been output with estimates attached.  ' +
                    'Query "data" on the return object to get it.  '
                );

            if (masterCaption)
                console.log(`-----------------------------------`);

        };

        return results;

}}

regress.help = `

    regress returns an object with the following properties:
    
        - coefficients: A dataset containing properties of the regression coefficients.
        - model: an object with the following properties: rSquared, rSquaredAdj, F, pVal.  
          If attachData = true, then also breuchPagan and breuchPaganPval.
        - data: if attachData = true, then the original data with estimates appended
        - log: a method to display the output described above in friendly form

    See the github 'built-in reducers' wiki page for this library for more information.  

`;

// Output a selector of row properties that returns an array
// and a set of labels (keys) that pertain to the array
function _regress_processSelector(selector) {

    let keys = selector.split(',').map(key => key.trim());
    return [
        keys,
        (row) => keys.map(key => row[key])
    ];

}

var redu = /*#__PURE__*/Object.freeze({
  __proto__: null,
  first: first,
  last: last,
  sum: sum,
  count: count,
  avg: avg,
  std: std,
  mad: mad,
  cor: cor,
  covMatrix: covMatrix,
  corMatrix: corMatrix,
  dimReduce: dimReduce,
  regress: regress
});

function _(obj) { 
    if (!isIterable(obj))
        throw 'Object instantiating fluent_data must be iterable';
    return obj instanceof dataset ? obj : new dataset(obj);
}

_.dataset = dataset;
_.matrix = matrix;
_.round = round;
_.roundToDigits = roundToDigits;
_.random = random;

let undocumented = `
    tableToString,
    gamma, gammaLogged, incGamma, incGammaLower,
    beta, incBeta, invIncBeta,
    chiCdf,
    Fcdf, Fquantile,
    studentsTcdf, studentsTfromCor, studentsTquantile
`;

for (let ud of undocumented.split(',').map(term => term.trim()))
    _[ud] = g$1[ud];

Object.assign(_, redu);

dataset.prototype.dimReduce = function (...args) {
    return dimReduce(...args)(this.data);
};

dataset.prototype.regress = function (...args) {
    return regress(...args)(this.data);
};

module.exports = _;
