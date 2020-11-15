/**
 * ISC License (ISC)
 * Copyright (c) 2019, Paul Wilcox <t78t78@gmail.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

let round = (term, digits) => Math.round(term * 10 ** digits) / 10 ** digits;

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
        skipChecks = false // if true, skips validity checks
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

        if (!skipChecks)
            this.validate();

    }
    
    setColNames (colNames) {
        if (isString(colNames))
            colNames = colNames.split(',').map(name => name.trim());
        if (this.data.length > 0 && this.data[0].length != colNames.length)
            throw `colNames is not of the same length as a row of data.`
        this.colNames = colNames;
        return this;
    }

    setRowNames (rowNames) {
        if (isString(rowNames))
            rowNames = rowNames.split(',').map(name => name.trim());
        if (this.data.length > 0 && this.data.length != rowNames.length)
            throw `rowNames is not of the same length as the data.`
        this.rowNames = rowNames;
        return this;
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

    isSquare() {
        if (this.data.length == 0)
            return true;
        let rows = this.data.length;
        let cols = this.data[0].length;
        return rows == cols;
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

    // (func) or (otherMatrix, func)
    apply(...args) {

        let func = typeof args[0] == 'function' 
            ? (r,c) => args[0](this.data[r][c])
            : (r,c) => args[1](this.data[r][c], args[0].data[r][c]); 

        for(let r in this.data)
            for (let c in this.data[r])
                this.data[r][c] = func(r,c);

        return this;

    }

    reduce(direction, func, seed = undefined) {

        let aggregated = [];
        
        if (direction == 'row' || direction == 1) {
            this.colNames = null;
            for (let row of this.data) 
                if (seed != undefined)
                    aggregated.push([row.reduce(func, seed)]);
                else 
                    aggregated.push([row.reduce(func)]);
        }

        else if (direction == 'col' || direction == 'column' || direction == 2) {
            this.rowNames = null;
            let colCount = this.data.length == 0 ? 0 : this.data[0].length;
            for (let c = 0; c < colCount; c++) {
                let agg = seed || 0;
                for(let row of this.data) 
                    agg = func(agg, row[c]);
                aggregated.push([agg]);
            }
        }

        else if (direction == 'all' || direction == 0) {
            this.rowNames = null;
            this.colNames = null;
            let agg = seed || 0;
            for (let row of this.data)
                for (let cell of row)
                    agg = func(agg, cell);
            aggregated.push([agg]);
        }

        this.data = aggregated;
        return this;

    }

    transpose() {

        let result = [];
        for(let r in this.data) 
            for(let c in this.data[r]) 
                if (r == 0)
                    result.push([this.data[r][c]]);
                else 
                    result[c].push(this.data[r][c]);
        this.data = result;
        
        let rn = this.rowNames;
        let cn = this.colNames;
        this.rowNames = cn;
        this.colNames = rn;

        return this;

    }

    multiply(other) {

        if (!isNaN(other) && isFinite(other)) 
            for (let r in this.data)
                for (let c in this.data[r])
                    this.data[r][c] *= other;

        else if (Array.isArray(other))  {
            this.colNames = null;
            this.data = this._multiplyVector(other);
        }

        else if (other instanceof matrix) {
            this.colNames = other.colNames;
            this.data = this._multiplyMatrix(other);
        }

        return this;

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
            return new matrix(vector, x => [x], true);
        }

        for (let r = 0; r < this.data.length; r++)
        for (let c = 0; c < this.data[r].length; c++)
            if (r != c) 
                this.data[r][c] = 0;
        return this;

    }

    round(digits) {
        for(let row of this.data) 
            for(let c in row) {
                row[c] = parseFloat(row[c].toFixed(digits));
                if(row[c] == -0)
                    row[c] = 0;
            }
        return this;
    }

    equals(other, dataOnly = true) {

        let arrayEq = (a,b) => {
            if (a.length != b.length)
                return false;
            for(let i in a)
                if (a[i] != b[i])
                    return false;
            return true;
        };

        if (this.data.length != other.data.length)
            return false;
        if (this.data.length != 0 && this.data[0].length != other.data[0].length)
            return false;

        for (let r in this.data)
            if (!arrayEq(this.data[r], other.data[r]))
                return false;

        return dataOnly ? true
            : !arrayEq(this.rowNames, other.rowNames) ? false 
            : !arrayEq(this.colNames, other.colNames) ? false
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
    solve(other) {

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

            for(let r = this.data.length - 2; r >= onOrAfterIndex; r--) {

                let prev = this.data[r];
                let cur = this.data[r + 1];
                let prevLeader = leadingItem(prev);
                let curLeader = leadingItem(cur);
                let otherPrev = other[r];
                let otherCur = other[r + 1];

                let needsPromote = 
                    prevLeader.pos > curLeader.pos || 
                    (prevLeader.pos == curLeader.pos && prevLeader.val > curLeader.val);

                if (needsPromote) {
                    this.data[r + 1] = cur;
                    this.data[r] = prev;
                    other[r + 1] = otherCur;
                    other[r] = otherPrev;
                }
                
                prevLeader = curLeader;

            }

        };

        let subtractTopMultiple = (onOrAfterIndex) => {
                
            let topLead = leadingItem(this.data[onOrAfterIndex]);

            rowMultiply(this.data[onOrAfterIndex], 1 / topLead.val);
            rowMultiply(other[onOrAfterIndex], 1 / topLead.val);

            for(let r = 0; r < this.data.length; r++) {
                if (r == onOrAfterIndex)
                    continue;
                let row = this.data[r];
                let counterpart = row[topLead.pos];
                if (counterpart == 0)
                    continue;
                let multipliedRow = rowMultiply(
                    clone(this.data[onOrAfterIndex]), 
                    -counterpart
                );
                rowAdd(this.data[r], multipliedRow);
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

            if (this.data.length == 0 || other.length == 0) 
                throw 'cannot solve when either input is empty';

            if (this.data.length != other.length)
                throw 'cannot solve when input lengths do not match';

        };

        initializations();

        for (let i = 0; i < this.data.length; i++) {
            sort(i);
            subtractTopMultiple(i);
        }

        this.data = other;

        return this;

    }

    get(rows, cols) {

        let allRows = [...Array(this.data.length).keys()];
        let allCols = [...Array(this.data[0].length).keys()];
    
        if (rows === undefined || rows === null)
            rows = allRows;
        if (cols === undefined || cols === null)
            cols = allCols;

        if (rows === allRows && cols === allCols)
            return this;

        // Turn rows or cols parameters into array form
        // > 1 turns into [1],
        // > [false,true,true,false] turns into [1,2]
        // > [-2,-1] turns into [0,3] for 'row' direction and matrix having 4 rows
        // > (row,ix) => row[0] > ix selects any row where the value of the first cell is greter than the row position  
        let arrayify = (param, direction) => {
    
            // convert int form to int array form
            if (typeof param === 'number') 
                param = [param];
    
            if (Array.isArray(param) && param.length >= 0) {
                
                // convert boolean form to int array form
                if (typeof param[0] === 'boolean') {

                    if (direction == 'rows' && param.length != this.data.length) 
                        throw `Bool array passed to 'rows' is length ${param.length} (${this.data.length} expected)`;
                    else if (direction == 'cols' && param.length != this.data[0].length)
                        throw `Bool array passed to 'cols' is length ${param.length} (${this.data[0].length} expected)`;
                    
                    param = param
                        .map((row,ix) => row === true ? ix : undefined)
                        .filter(row => row != undefined);

                }
    
                if (typeof param[0] === 'number') {
    
                    // make sure all numbers are integers
                    param = param.map(row => Math.round(row));
    
                    for(let x of param) 
                        if (Math.abs(x) > (direction == 'rows' ? this.data.length : this.data[0].length) - 1)
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
                    for(let r = 0; r < this.data.length; r++)  {
                        if (param(this.data[r], r))
                            _param.push(r);
                    }
                else 
                    for(let c = 0; c < this.data[0].length; c++) {
                        let transposed = [];
                        for(let r = 0; r < this.data.length; r++)
                            transposed.push(this.data[r][c]);
                        if(param(transposed, c))
                            _param.push(c);
                    }
                param = _param;
            }
    
            return param;
    
        };
    
        rows = arrayify(rows, 'rows');
        cols = arrayify(cols, 'cols');
    
        let subset = [];
        for(let r of rows) {
            let row = [];
            for (let c of cols)
                row.push(this.data[r][c]);
            subset.push(row);
        }

        this.rowNames = rows.map(rix => this.rowNames[rix]);
        this.colNames = cols.map(cix => this.colNames[cix]);
        this.data = subset;
        return this;

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
    return new matrix(result, row => row, true);
};

matrix.zeroes = function (numRows, numCols) { return matrix.repeat(0, numRows, numCols, false); };
matrix.ones = function (numRows, numCols) { return matrix.repeat(1, numRows, numCols, false); };
matrix.identity = function(numRows) { return matrix.repeat(1, numRows, numRows, true); };

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

let mergeMethod = {
    hash: 'hash',
    loop: 'loop',
    hashDistinct: 'hashDistinct'
};

// Options can be a mapper function,
// it can be a keyword representing a mapper function,
// or it can be, as the term implies, an object 
// of paramters for passing options 
function* merge (
    leftData, 
    rightData, 
    matcher, 
    options, 
    method
) {

    let leftHasher;
    let rightHasher;
    let mapper;

    if (method && !Object.keys(mergeMethod).includes(method)) throw `
        method '${method}' is not recognized.  Leave undefined or
        use one of: ${Object.keys(mergeMethod).join(', ')}.
    `;

    // if options is an object with properties 
    if (!isFunction(options) && !isString(options)) {
        leftHasher = options.leftHasher || options.hasher;
        rightHasher = options.rightHasher || options.hasher;
        mapper = normalizeMapper(options.mapper, matcher);
    }
    // if options is a function or a string
    else {

        mapper = normalizeMapper(options, matcher);
        let hashers = parser.pairEqualitiesToObjectSelectors(matcher);

        if(!hashers) {
            method = method || 'loop';
            if (method != 'loop') throw ` 
                Must loop merge, "${matcher}" could not be parsed 
                into functions that return objects for hashing.`;
        }
        else {
            leftHasher = hashers.leftFunc;
            rightHasher = hashers.rightFunc;
        }

    }

    // If no hashers are passed, then do full-on loop join
    if (method == 'loop') {
        yield* loopMerge(leftData, rightData, matcher, mapper);
        return;
    }

    if (!method || ['hash', 'hashDistinct'].includes(method))
        yield* hashMerge(
            leftData, 
            rightData,
            matcher,
            leftHasher, 
            rightHasher,
            mapper, 
            method 
        );

}

function* hashMerge (
    leftData, 
    rightData, 
    matcher,
    leftHasher,
    rightHasher,
    mapper,
    method
) {

    let leftBuckets = 
        new hashBuckets(leftHasher, method == 'hashDistinct')
        .addItems(leftData);

    let rightBuckets = 
        new hashBuckets(rightHasher, method == 'hashDistinct')
        .addItems(rightData);

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
            yield* wrapper(mapper(undefined, rightItem));

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
            yield* wrapper(mapper(leftData[l], rightData[r]));
        }
    }

    for (let l in leftData) 
        if (!leftHits.has(l))
            yield* wrapper(mapper(leftData[l], undefined));

    for (let r in rightData) 
        if (!rightHits.has(r))
            yield* wrapper(mapper(undefined, rightData[r]));

}

function* wrapper (mapped) {
    if (!mapped)
        return;
    if (mapped[Symbol.iterator]) 
        yield* mapped;
    else 
        yield mapped;
}

function normalizeMapper (mapFunc, matchingLogic) {

    if (!mapFunc)
        mapFunc = 'both null'; // inner join by default

    if (isString(mapFunc)) {
        
        if (mapFunc.length == 2) 
            mapFunc = inflateKeywords(mapFunc);

        let keywords = mapFunc.split(' ');
        let onMatched = keywords[0];
        let onUnmatched = keywords[1];
        let allowedTerms = ['both', 'thob', 'left', 'right', 'null', 'stack'];

        if (!allowedTerms.includes(onMatched) || !allowedTerms.includes(onUnmatched))
            throw `mapper must be one of: ${allowedTerms.join(',')}}`;

        return (left,right) => mergeByKeywords(left, right, onMatched, onUnmatched);

    }

    if (!parametersAreEqual(matchingLogic, mapFunc))
        throw 'Cannot merge.  Parameters for "mapper" and "matchingLogic" do not match"';

    return mapFunc;

}

function mergeByKeywords (left, right, onMatched, onUnmatched) {

    if(left && right)
        switch(onMatched) {
            case 'both': return noUndefined(Object.assign({}, right, left));
            case 'thob': return noUndefined(Object.assign({}, left, right));
            case 'left': return left;
            case 'right': return right;
            case 'null': return undefined;
            case 'stack': return [left, right]; 
        }

    switch(onUnmatched) {
        case 'both': return left || right;
        case 'thob': return left || right; 
        case 'left': return left;
        case 'right': return right;
        case 'null': return undefined;
    }

}

function inflateKeywords (keywordString) {
    let replacer = str => 
          str == 'b' ? 'both'
        : str == 't' ? 'thob' 
        : str == 'l' ? 'left'
        : str == 'r' ? 'right'
        : str == 'n' ? 'null'
        : str == 's' ? 'stack'
        : null;
    return replacer(keywordString.substring(0,1)) + ' ' +
        replacer(keywordString.substring(1,2)); 
}

function parametersAreEqual (a,b) {

    a = parser.parameters(a);
    b = parser.parameters(b);

    if (a.length != b.length)
        return false;

    for(let i in a)
        if (a[i] != b[i])
            return false;

    return true;

}

class dataset {

    constructor(data, groupLevel = 1) {
        this.data = data;
        this.groupLevel = groupLevel;
    }

    *[Symbol.iterator]() { 
        yield* this.data;
    }

    map (func) {    
        let _map = function* (data) {
            for(let row of data)
                yield noUndefined(func(row));
        };
        this.data = recurse(_map, this.data, this.groupLevel);
        return this;
    }

    filter (func) {    
        let _filter = function* (data) {
            for(let row of data)
            if(func(row))
                yield row;
        };
        this.data = recurse(_filter, this.data, this.groupLevel);
        return this;
    }

    sort (func) {
        let outerFunc = parser.parameters(func).length > 1 
            ? data => quickSort(data, func, false)
            : data => quickSort(data, func, true);
        this.data = recurse(outerFunc, this.data, this.groupLevel);
        return this;
    } 

    group (func) {
        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets();
        this.data = recurse(outerFunc, this.data, this.groupLevel);
        this.groupLevel++;
        return this;
    }

    ungroup (func) {

        if (!func) 
            func = x => x;

        if (this.groupLevel == 1) {
            let counter = 0;
            for (let item of this.data) {
                if (++counter > 1)
                    throw   'Ungrouping to level 0 is possible, but ' +
                            'there can only be one item in the dataset.';
                this.data = item;
            }
            this.groupLevel--;
            return this;
        }

        let outerFunc = function* (data) {
            for (let item of data)
            for (let nested of item)
                yield func(nested);
        };

        // stop early becuase you want one level above base records
        this.data = recurse(outerFunc, this.data, this.groupLevel - 1);
        this.groupLevel--;
        return this;

    }

    reduce (obj, ungroup = true) {

        let isNaked = Object.keys(obj).length == 0;

        // wrap result in array to bring back to original nesting level
        let outerFunc = data => {
            let agg = {};
            if (isNaked)
                return [obj(data)];
            for(let [key,reducer] of Object.entries(obj)) {
                agg[key] = reducer(data);
            }
            return [agg]; 
        };

        this.data = recurse(outerFunc, this.data, this.groupLevel);

        if (ungroup)
            this.ungroup();

        return this;

    }

    distinct (func, sorter) {

        func = func || (x => x);
        
        if (sorter) sorter = 
            parser.parameters(sorter).length > 1 
            ? data => quickSort(data, func, false)
            : data => quickSort(data, func, true);
        else 
            sorter = data => data;

        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets()
            .map(bucket => {
                return [...sorter(bucket)][0]
            });

        this.data = recurse(outerFunc, this.data, this.groupLevel);
        return this;

    }

    merge (incoming, matcher, options, method) {

        if (matcher == '=') 
            matcher = (l,r) => eq(l,r);

        let outerFunc = data => [...merge (
            data, 
            incoming instanceof dataset ? incoming.data : incoming, 
            matcher, 
            options, 
            method
        )];

        this.data = recurse(outerFunc, this.data, this.groupLevel); 
        return this;

    }

    matrix(        
        selector, // csv of prop names or func returning array of numbers
        skipChecks = false // if true, skips validity checks)
    ) {
        return new matrix(this.data, selector, skipChecks);
    }

    with (func) {
        let arr = recurseToArray(x => x, this.data, this.groupLevel);
        func(arr);
        this.data = arr;
        return this;
    }

    get (func) {
        if (!isIterable(this.data)) {
            if (func)
                this.data = func(this.data);
            return this.data;
        }
        let arr = recurseToArray(
            func || function(x) { return x }, 
            this.data,
            this.groupLevel
        );
        this.data = arr;
        return arr;
    }

    toJsonString(func) {
        let dataJson = JSON.stringify(this.get(func));
        return `{"data":${dataJson},"groupLevel":${this.groupLevel}}`;
    }

}

function* recurse (func, data, levelCountdown) {

    if (levelCountdown === 0)
        return func([data])[0];

    if (levelCountdown > 1) { // data is nested groups
        for (let item of data) 
            yield recurse(func, item, levelCountdown - 1);
        return;
    }

    yield* func(data); // data is base records

}

function recurseToArray (func, data, levelCountdown) {

    if (levelCountdown === 0)
        return func([data])[0];

    let list = [];
    for(let item of data)
        list.push(
            levelCountdown > 1          
            ? recurseToArray(func, item, levelCountdown - 1)
            : noUndefined(func(item))
        );
    return list;    

}

function _(obj) { 
    if (!isIterable(obj))
        throw 'Object instantiating fluent_data must be iterable';
    return obj instanceof dataset ? obj : new dataset(obj);
}

_.fromJson = function(json) {

    let ds = new dataset();

    if (json.constructor.name == 'Response') 
        return json.json().then(parsed => {
            ds.data = parsed.data;
            ds.groupLevel = parsed.groupLevel;
            return ds;
        });

    let parsed = isString(json) ? JSON.parse(json) : json;
    ds.data = parsed.data;
    ds.groupLevel = parsed.groupLevel;

    return ds;

};

_.mergeMethod = mergeMethod;
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
            let transposedIvs = ivs.clone().transpose();

            // I think this translates to variances.
            let variances = transposedIvs.clone().multiply(ivs).inverse();
            
        // Calcaulate the coefficients
                        
            let coefficients = 
                variances.clone()
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

        result = asMatrix.clone().apply(result, (a,b) => a - b); // result is deviations
        result = result.clone().transpose().multiply(result); // result is squared deviations        
        return result.multiply(1/(asMatrix.data.length - (isSample ? 1 : 0)));

    };

// No need for 'isSample' as with covMatrix, because 
// the results are the same for a sample vs a population.
_.corMatrix = (selector) =>
    data => {
        // math.stackexchange.com/questions/186959/correlation-matrix-from-covariance-matrix/300775
        let cov = _.covMatrix(selector)(data);
        let STDs = cov.clone().diagonal().apply(x => Math.pow(x,0.5));
        return STDs.clone().inverse().multiply(cov).multiply(STDs.clone().inverse());
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
        let STDs = cov.clone().diagonal(true).apply(x => Math.pow(x,0.5));
        let SS = STDs.clone().multiply(STDs.clone().transpose());
        return cov.clone().apply(SS, (x,y) => x / y);
    };

export default _;
