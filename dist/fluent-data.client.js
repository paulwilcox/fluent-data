/**
 * ISC License (ISC)
 * Copyright (c) 2019, Paul Wilcox <t78t78@gmail.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

// e.g. round(5.239, 2) is 5.24
let round = (term, digits) => Math.round(term * 10 ** digits) / 10 ** digits;

// e.g. roundToMultiple(5.239, 0.25) is 5.25 becasue that is the closest 0.25th 
let roundToMultiple = (term, multiple) => {

    let result = Math.round(term / multiple) * multiple;

    // Binary and floating point arithmetic sometimes makes it so that the
    // result comes out as a long decimal with an extreme fraction at the
    // end.  Obviously that's annoying as this is a rounding function.
    // This seeks to cut that off by getting the number of digits of the 
    // multiple parameter and rounding to that.
    let multStr = multiple.toExponential();
    let [multNonE, multE] = multStr.split('e');
    let multDec = (multNonE.split('.')[1] || '').length - parseInt(multE);

    return round(result, multDec);

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

function RoundObjectNumbers (obj, precision) {
    for(let key of Object.keys(obj)) {
        let type = typeof(obj[key]);
        if (type === 'number') 
            obj[key] = round(obj[key], precision);
        else if (type === 'object') 
            RoundObjectNumbers(obj[key], precision);
    }
}

let noUndefined = obj => {
    
    for(let key of Object.keys(obj))
        if (obj[key] === undefined) 
            delete obj[key];

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

function tableToString (
    data, 
    mapper, 
    limit = 50, 
    headers = true
) {

    mapper = mapper || (x => x);
    let props = [];
    let vals = [];

    if (data.length == 0) {
        data = [{ empty: '' }];
        headers = false;
    }

    // Initially, values are multi-line.  Even if just 
    // one line they're represented as an array.
    let toStringArray = (val) => val.toString().split(`\r\n`);

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
            ...vals.map(row => row[i].length), 
            headers ? props[i].length : 0
        );

    for(let i = 0; i < props.length; i++)
        props[i] = props[i].padEnd(lengths[i]);

    for(let row of vals)
        for(let i = 0; i < row.length; i++) 
            row[i] = row[i].padEnd(lengths[i]);

    let tl = '\u250c';
    let tm = '\u252c';
    let tr = '\u2510';
    let ml = '\u251c';
    let mm = '\u253c';
    let mr = '\u2524';
    let bl = '\u2514';
    let bm = '\u2534';
    let br = '\u2518';
    let hz = '\u2500';
    let vt = '\u2502';
    let nl = '\r\n';
    let sp = ' ';

    let topBorder = tl+hz + lengths.map(l => ''.padStart(l,hz+hz+hz)).join(hz+tm+hz) + hz+tr+nl;
    let headerRow = vt+sp + props.join(sp+vt+sp) + sp+vt+nl;
    let headerDivider = ml+hz + lengths.map(l => ''.padStart(l,hz+hz+hz)).join(hz+mm+hz) + hz+mr+nl;
    let dataRows = vals.map(row => vt+sp + row.join(sp+vt+sp) + sp+vt).join(nl) + nl;
    let botBorder = bl+hz + lengths.map(l => ''.padStart(l,hz+hz+hz)).join(hz+bm+hz) + hz+br;

    return topBorder +
        (headers ? headerRow : '') + 
        (headers ? headerDivider : '') +
        dataRows +
        botBorder;

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

        this.data = data.map(selector);

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
                    yield _this.get(r,null);
            }
        }
    }

    get cols() { 
        let _this = this; 
        return {
            [Symbol.iterator]: function* () {
                for(let c = 0; c < _this.nCol; c++) 
                    yield _this.get(null,c);
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
        let result = [];
        for(let row of this.data) {
            let newRow = [];
            for (let cell of row) 
                newRow.push(cell);
            result.push(newRow);
        }
        let mx = new matrix();
        mx.data = result;
        mx.colNames = this.colNames;
        mx.rowNames = this.rowNames;
        return mx;
    }

    appendCols(other) {
        let mx = this.clone();
        if (Array.isArray(other)) 
            other = new matrix(other);
        if (other.nRow != mx.nRow)
            throw `cannot append columns if row counts do not match`;
        for(let r = 0; r < mx.nRow; r++) 
            mx.data[r].push(...other.data[r]);
        mx.colNames.push(...other.colNames);
        mx.validate();
        return mx;
    }

    appendRows(other) {
        let mx = this.clone();
        if (Array.isArray(other))
            other = new matrix(other);
        if (other.nCol != mx.nCol)
            throw `cannot append rows if column counts do not match`;
        for (let r = 0; r < other.nRow; r++) {
            mx.rowNames.push(other.rowNames[r]);
            mx.data.push(other.data[r]);
        }
        mx.validate();
        return mx;
    }

    log(roundDigits) {

        let clone = roundDigits === undefined ? this.clone() : this.round(roundDigits);
        let printable = {};

        // if the keyName is a repeat in keyHolder, add a ' (#)' after it.
        let addNumSuffix = (keyHolder, keyName) => {
            if(!Object.keys(keyHolder).includes(keyName))
                return keyName;
            let num = parseInt(keyName.match(/(?<= \()\d+(?=\)$)/));
            if (isNaN(num)) 
                num = 1;
            return keyName.replace(/ \(\d+\)$/, '') + ` (${num + 1})`;
        };
        
        for (let r in clone.data) {
            let obj = {};
            for (let c in clone.data[r]) {
                let colName = clone.colNames ? clone.colNames[c] : c;
                colName = addNumSuffix(obj, colName);
                obj[colName] = clone.data[r][c];
            }
            let rowName = clone.rowNames ? clone.rowNames[r] : r;
            rowName = addNumSuffix(printable, rowName);    
            printable[rowName] = obj;
        }

        console.table(printable);
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
        mx = mx.get(-(mx.nRow - 1));

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
        return svd.R.multiply(inv).multiply(svd.L.transpose());
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

    round(digits) {
        let mx = this.clone();
        for(let row of mx.data) 
            for(let c in row) {
                row[c] = parseFloat(row[c].toFixed(digits));
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
    
            let Rsub = R.clone().get(ix => ix >= level, ix => ix >= level);
            if (Rsub.data[0].length == 0) 
                throw `QR decomposition did not converge in time to produce an upper triangular R.`;
            let col0 = Rsub.clone().get(null, 0);
            let e = matrix.identity(Rsub.data.length).get(null, 0);
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
       
            let upperSquare = R.clone().get(ix => ix < R.data[0].length, null);
            let lowerRectangle = R.clone().get(ix => ix >= R.data[0].length, null);
            let lowerIsZeroes = !lowerRectangle.round(10).data.some(row => row.some(cell => cell != 0));
    
            if (upperSquare.isUpperTriangular(1e-10) && lowerIsZeroes)
                return;
    
            cycle(++level);
    
        };
    
        cycle();
        
        return { 
            A: this, 
            R, 
            Q, 
            test: (roundDigits = 8) => 
                this.round(roundDigits).equals(
                    Q.multiply(R).round(roundDigits)
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
            D = D.get(id => id < r, id => id < r);
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
                .get(null, ix => ix >= 0 && ix <= r - 1);

            let qr = this.transpose().multiply(L).decomposeQR();
            R = qr.Q.get(null, ix => ix >= 0 && ix <= r - 1).transpose();
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
            showObjects: (round) => matrix.logMany({ 
                iterations, 
                A: this, 
                L, 
                D, 
                R
            }, 'unconverged', round)
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
                values = values.map(v => roundToMultiple(v, demoted));

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
            let vector = vectors.get(null, sorted.ix);
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
                matrix.logMany({
                    iterations, 
                    stopThreshold, 
                    values, 
                    diag, 
                    prev,
                    test: diag.map((d,i) => Math.abs(d - prev[i]))
                }, 'failing objects', 8);
                throw `Eigenvalues did not converge within ${maxIterations} iterations.`;
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
        let M = A.subtract(ei).pseudoInverse();

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
                    matrix.logMany({
                        val: [eigenvalue],
                        vect: new matrix([vector]).transpose(),
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
                values[v] = roundToMultiple(values[v], mergeThreshold);
            }            

        return values;

    }

    _eigen_Hessenderize (A) {

        for (let level = 0; level < A.data.length - 2; level++) {

            let L1L0 = A.data[level+1][level];

            let alpha = // sum of squares of A[level+i:n, level]
                A.clone() 
                .get((row,ix) => ix > level, level)
                .apply(x => Math.pow(x,2))
                .transpose()
                .data[0]
                .reduce((a,b) => a+b);
            alpha = Math.pow(alpha,0.5);
            alpha = -Math.sign(L1L0) * alpha; 

            let r = Math.pow(alpha,2) - L1L0 * alpha;
            r = Math.pow(r / 2, 0.5);

            let v = new matrix([...Array(A.data.length).keys()].map(ix => [
                ix <= level ? 0
                : ix == (level + 1) ? (L1L0 - alpha) / (2*r) 
                : A.data[ix][level] / (2*r)
            ]));
            let vv = v.clone().multiply(v.clone().transpose());

            let P = matrix.identity(v.data.length)
                .subtract(vv.multiply(2));

            A = P.clone().multiply(A.multiply(P));

        }

        return A;

    }

    _eigen_test(origMatrix, values, vectors, errorThreshold) {

        if(values instanceof matrix) 
            values = values.diagonal(true).data;

        if(Array.isArray(vectors))
            vectors = new matrix(vectors);

        for (let i = 0; i < vectors.data[0].length; i++) {
            let getVect = () => vectors.get(null, i);
            let AV = origMatrix.multiply(getVect());
            let VV = getVect().multiply(values[i]);
            if (!AV.equals(VV, errorThreshold, true))
                return false;
        }

        return true;

    }

    get(rows, cols) {

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

matrix.logMany = (obj, objectTitle = 'object', roundDigits) => {

    if (objectTitle)
        console.log(`%c ---------- printing ${objectTitle} ----------`, 'color:red;margin-top:10px');

    let nonTables = {};
    let tables = [];

    if (isString(obj)) 
        obj = { objectIsAString: obj };

    for (let key of Object.keys(obj)) 
        if(obj[key] == null || obj[key] == undefined) ;
        else if(obj[key] instanceof matrix) {
            tables.push({
                titleFunc: () => console.log('%c Matrix For: ' + key, 'color:orange;font-weight:bold;margin-top:10px'),
                tableFunc: () => obj[key].log(roundDigits) 
            });
        }
        else if (Array.isArray(obj[key]) || typeof obj[key] === 'object') {
            tables.push({
                titleFunc: () => console.log('%c Array/Object For: ' + key, 'color:orange;font-weight:bold;margin-top:10px'),
                tableFunc: () => console.table(obj[key])
            });
        } 
        else if (typeof obj[key] !== 'function') {
            nonTables[key] = obj[key];
        }
    
    if (Object.keys(nonTables).length == 1 && nonTables.objectIsAString != undefined) {
        console.log(nonTables.objectIsAString);
    }
    else if (Object.keys(nonTables).length > 0) {
        console.log('%c Primitives:', 'color:green;font-weight:bold;margin-top:10px');
        console.table(nonTables);
    }

    for(let table of tables) {
        table.titleFunc();
        table.tableFunc();
    }

    if (objectTitle)
        console.log(`%c ---------- done printing ${objectTitle} ----------`, 'color:red;margin-top:10px');

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
        if (!isString(key))
            key = stringifyObject(key);

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
        if (!isString(key))
            key = stringifyObject(key);
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

    arrayify () {

        let list = [];
        list.key = this.key;

        if (this.dataIsNaked)
            return this.data;
        else if (this.data != null) 
            list.push(...this.data);

        for(let child of this.children)
            list.push(child.arrayify());

        return list;

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
                let g = new grouping(key);
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

}

grouping.groupify = (arrayified, _parent) => {

    let grp = new grouping();
    grp.parent = _parent || null;
    grp.key = arrayified.key || null;

    for(let row of arrayified) 
        if (Array.isArray(row)) {
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

    *[Symbol.iterator]() { 
        yield* this.data;
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

    reduce (obj, ungroup = true) {

        let isNaked = Object.keys(obj).length == 0;

        // wrap result in array to bring back to original nesting level
        this.apply(data => {
            let agg = {};
            if (isNaked)
                return [obj(data)];
            for(let [key,reducer] of Object.entries(obj)) 
                agg[key] = reducer(data);
            return [agg]; 
        });

        if (ungroup) 
            this.ungroup();

        return this;

    }

    distinct (hashKeySelector, sorter) {

        hashKeySelector = hashKeySelector || (x => x);
        
        let getFirstBucketItem = sorter
            ? (bucket) => new dataset(bucket).sort(sorter)[0]
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
            matcher = matcher == '=' ? (l,r) => eq(l,r) : matcher;

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

    with (func) {
        let arr = recurseToArray(x => x, this.data, this.groupLevel);
        func(arr);
        this.data = arr;
        return this;
    }

    log (
        element = null, 
        func = x => x, 
        limit = 50
    ) {

        let arr = recurseToArray(x => x, this.data, this.groupLevel);        

        let recurForGroup = (data, levelCountdown) => {
            
            if (levelCountdown == 1) 
                return tableToString(data, func, limit);

            let list = [];
            for(let group of data) 
                list.push({ group: recurForGroup(group, levelCountdown - 1) });
            return tableToString(list, x => x, limit, false); 
        };
        
        let groupedOutput = recurForGroup(arr, this.groupLevel);        
        
        if (element) 
            document.querySelector(element).innerHTML += 
                groupedOutput.replace(/\r\n/g,'<br/>').replace(/\s/g, '&nbsp;');
        else
            console.log(groupedOutput);

        this.data = arr;
        return this;

    }

    get (mapper = null) {
        if (mapper)
            this.map(mapper);
        return this.arrayify();
    }

    toJsonString(func) {
        let getted = this.get(func);
        return JSON.stringify(getted);
    }

}

function _(obj) { 
    if (!isIterable(obj))
        throw 'Object instantiating fluent_data must be iterable';
    return obj instanceof dataset ? obj : new dataset(obj);
}

_.fromJson = function(json) {

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

_.matrix = matrix;

_.round = round;

_.first = rowFunc =>
    data => {
        for (let row of data )
            if (rowFunc(row) !== undefined && rowFunc(row) !== null)
                return rowFunc(row);
        return null;
    };

_.last = rowFunc => 
    data => {
        for (let i = data.length - 1; i >= 0; i++)
            if (rowFunc(data[i]) !== undefined && rowFunc(data[i]) !== null)
                return rowFunc(data[i]);
        return null;
    };

_.sum = (rowFunc, options) => 
    data => {
        let agg = 0;
        for (let row of data) 
            agg += rowFunc(row);
        if (options && options.test) 
            agg = -agg;
        return agg;
    };

_.count = rowFunc => 
    data => {
        let agg = 0;
        for (let row of data) {
            let r = rowFunc(row);
            if (r !== undefined && r !== null)
                agg += 1;
        }
        return agg;
    };

_.avg = rowFunc => 
    data => {
        let s = _.sum(rowFunc)(data);
        let n = _.count(rowFunc)(data);
        return s / n;
    };

_.std = (rowFunc, isSample = false) => 
    data => {
        let m = _.avg(rowFunc)(data);
        let ssd = data.reduce((agg,row) => agg + Math.pow(rowFunc(row) - m,2), 0);
        let n = _.count(rowFunc)(data);
        if (isSample)
            n--;
        return Math.pow(ssd/n, 0.5);
    };

_.mad = rowFunc => 
    data => {

        let avg = _.avg(rowFunc)(data);
        let devs = [];

        for (let ix in data)
            devs[ix] = Math.abs(rowFunc(data[ix]) - avg);
    
        return _.avg(x => x)(devs);    

    };

_.cor = (rowFunc, options) => 
    data => {
    
        let xAvg = _.avg(v => rowFunc(v)[0])(data);
        let yAvg = _.avg(v => rowFunc(v)[1])(data);
        let n = _.count(v => rowFunc(v))(data);

        let diffs = [];
        for(let row of data) 
            diffs.push({ 
                xDiff: rowFunc(row)[0] - xAvg, 
                yDiff: rowFunc(row)[1] - yAvg
            });

        let xyDiff = _.sum(row => row.xDiff * row.yDiff)(diffs);
        let xDiffSq = _.sum(row => row.xDiff ** 2)(diffs);
        let yDiffSq = _.sum(row => row.yDiff ** 2)(diffs);

        let cor = xyDiff / (xDiffSq ** 0.5 * yDiffSq ** 0.5);
        let df = n - 2;
        let t =  studentsTfromCor(cor, n);
        let pVal = studentsTcdf(t, df);
            
        if (options === undefined)
            return cor;

        if (options.tails == 2)
            pVal *= 2;

        return { cor, pVal, n, df, t };
        
    };

// Rows with 'estimate', 'actual', and 'residual' fields will have them overwritten.
_.regress = (ivSelector, dvSelector, options) => 
    data => {

        // Initializations

            options = Object.assign(
                { estimates: true }, 
                options
            );

            // Output a selector of row properties that returns an array
            // and a set of labels (keys) that pertain to the array
            let processSelector = (selector) => {
                
                if (isString(selector)) {
                    let keys = selector.split(',').map(key => key.trim());
                    return [
                        keys,
                        (row) => keys.map(key => row[key])
                    ];
                }

                let keys = Object.keys(selector({}));
                return [
                    keys, 
                    (row) => keys.map(key => selector(row)[key])
                ];

            };

            let [ ivKeys, outerIvSelector ] = processSelector(ivSelector);
            let [ dvKeys, outerDvSelector ] = processSelector(dvSelector);

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
                * _.sum(row => Math.pow(row.estimate - row.actual, 2))(data),
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
                if (options && options.ci) // If the user passed ci, process the ci function.
                    coefficients[c].ci = coefficients[c].ci(options.ci);
            }

        // Calculate the model-level statistics

            // en.wikipedia.org/wiki/F-test (Regression Problems | p1 and p2 include the intercept)
            let mean = _.avg(row => row.actual)(data);
            let ssComplex = _.sum(row => Math.pow(row.estimate - row.actual, 2))(data);
            let ssSimple = _.sum(row => Math.pow(row.actual - mean, 2))(data);
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

            if (options.estimates) {

                // We'll need to save these because rerunning regress will 
                // overwrite the properties.  But we need the original values
                // back in the final output.
                let clonedProps = data.map(row => ({
                    actual: row.actual, 
                    estimate: row.estimate, 
                    residual: row.residual
                }));

                let residRegress = _.regress(
                    ivSelector, 
                    row => [Math.pow(row.residual,2)], 
                    { estimates: false } // block estimtes to avoid infinite recursion.
                )(data);

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
                data: new dataset(data),
                coefficients,
                model: {
                    rSquared,
                    rSquaredAdj,
                    F,
                    pVal: Fcdf(F, paramsComplex - paramsSimple, n - paramsComplex)
                }
            }; 

            if (breuchPagan != undefined) 
                Object.assign(results.model, {breuchPagan, breuchPaganPval});

            if (options.maxDigits) {
                RoundObjectNumbers(results.coefficients, options.maxDigits);
                RoundObjectNumbers(results.model, options.maxDigits);
                for(let row of results.data) {
                    row.actual = round(row.actual, options.maxDigits);
                    row.estimate = round(row.estimate, options.maxDigits);
                    row.residual = round(row.residual, options.maxDigits);
                }
            }

            return results;

    };

_.covMatrix = (selector, isSample = true) =>
    data => {

        // stattrek.com/matrix-algebra/covariance-matrix.aspx

        let asMatrix = _(data).matrix(selector);

        let result = // result is averages
            matrix.ones(asMatrix.data.length)
            .multiply(asMatrix)
            .multiply(1/asMatrix.data.length); 

        result = asMatrix.apply(result, (a,b) => a - b); // result is deviations
        result = result.transpose().multiply(result); // result is squared deviations        
        return result.multiply(1/(asMatrix.data.length - (isSample ? 1 : 0)));

    };

// No need for 'isSample' as with covMatrix, because 
// the results are the same for a sample vs a population.
_.corMatrix = (selector) =>
    data => {
        // math.stackexchange.com/questions/186959/correlation-matrix-from-covariance-matrix/300775
        let cov = _.covMatrix(selector)(data);
        let STDs = cov.diagonal().apply(x => Math.pow(x,0.5));
        return STDs.inverse().multiply(cov).multiply(STDs.inverse());
    };

// CorMatrix gave the same results whether sample or population.  I wasn't familiar
// with that fact.  I had a very hard time googling this fact.  People said pop vs 
// sample were different (r vs rho, using s vs sigma).  But nobody was saying that 
// it would output the same whether you do n or n-1 (s vs sigma).  I saw that R didn't
// offer a pop vs sample 'cor' option.  I saw that Python's np.corrcoef 'bias' parameter
// was deprecated.  Their manual said this was because it didn't produce different
// resuts in the current and even in previous versions.  So at least they were having
// the same issue.  So, indications of equivalence everywhere, but nobody mentioned it 
// explicitly.  So I built this function just to calculate it more explicity in a way
// I could explicitly see following certain formulas I found for r vs rho, just to see
// if I would get the same matricies back again.  I did.  In the future I'll consider
// proving it (I imagine the size terms cancel out), but for now I'm moving on.     
_.corMatrix2 = (selector, isSample = true) =>
    data => {
        let cov = _.covMatrix(selector, isSample)(data);
        let STDs = cov.diagonal(true).apply(x => Math.pow(x,0.5));
        let SS = STDs.multiply(STDs.transpose());
        return cov.apply(SS, (x,y) => x / y);
    };

export default _;
