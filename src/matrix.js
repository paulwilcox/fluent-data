import * as g from './general.js';

export default class matrix {

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
        if (g.isString(selector)) {
            this.colNames = selector.split(',').map(name => name.trim());
            selector = (row) => this.colNames.map(name => row[name]);
        }

        this.data = data.map(selector)

        if (!skipChecks)
            this.validate();

    }
    
    setColNames (colNames) {
        if (g.isString(colNames))
            colNames = colNames.split(',').map(name => name.trim());
        if (this.data.length > 0 && this.data[0].length != colNames.length)
            throw `colNames is not of the same length as a row of data.`
        this.colNames = colNames;
        return this;
    }

    setRowNames (rowNames) {
        if (g.isString(rowNames))
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

    log(roundDigits) {
        let clone = roundDigits === undefined ? this.clone() : this.clone().round(roundDigits);
        let printable = {};
        for (let r in clone.data) {
            let obj = {};
            for (let c in clone.data[r]) 
                obj[clone.colNames ? clone.colNames[c] : c] = clone.data[r][c];
            printable[clone.rowNames ? clone.rowNames[r] : r] = obj;
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
    //
    add(other) {
        this.apply(other, (a,b) => a+b);
        return this;
    }
    //
    subtract(other) {
        this.apply(other, (a,b) => a-b);
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

    equals(other, errorThreshold = 0, dataOnly = true) {

        let arrayEq = (a,b) => {
            if (a.length != b.length)
                return false;
            for(let i in a)
                if (Math.abs(a[i] - b[i]) > errorThreshold)
                    return false;
            return true;
        }

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
        
        if (g.isString(type))
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
        }

        let rowMultiply = (row, multiplier) => {
            for(let c in row) 
                row[c] *= multiplier;
            return row;
        }

        let rowAdd = (rowA, rowB) => {
            for(let c in rowA) 
                rowA[c] += rowB[c];
            return rowA;
        }

        let clone = (row) => {
            let result = [];
            for(let cell of row)
                result.push(cell);
            return result;
        }

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
                    (prevLeader.pos == curLeader.pos && prevLeader.val > curLeader.val)

                if (needsPromote) {
                    this.data[r + 1] = cur;
                    this.data[r] = prev;
                    other[r + 1] = otherCur;
                    other[r] = otherPrev;
                }
                
                prevLeader = curLeader;

            }

        }

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
                )
                rowAdd(other[r], multipliedOther);
            }

        }

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

        }

        initializations();

        for (let i = 0; i < this.data.length; i++) {
            sort(i);
            subtractTopMultiple(i);
        }

        this.data = other;

        return this;

    }

    decompose(method) {

        if (method.toLowerCase() == "qr")
            return this._decomposeQR();

        else 
            throw `Decompose method '${method}' not recognized.  Presently only QR decomposition supported`;

    }

    _decomposeQR() {

        // example: cs.nthu.edu.tw/~cherung/teaching/2008cs3331/chap4%20example.pdf
        // properties: en.wikipedia.org/wiki/QR_decomposition

        let R = this.clone();
        let Q;
    
        if (this.data.length < this.data[0].length)
            throw   `Matrix has more columns (${this.data[0].length}) than rows (${this.data.length}).  ` + 
                    `Cannot take the Household transform.`;
    
        let cycle = (level = 0) => {
                
            if (level >= this.data.length - 1)
                return;
    
            let Rsub = R.clone().get((row,ix) => ix >= level, (col,ix) => ix >= level);
            if (Rsub.data[0].length == 0) 
                throw `QR decomposition did not converge in time to produce an upper triangular R.`;
            let col0 = Rsub.clone().get(null, 0);
            let e = matrix.identity(Rsub.data.length).get(null, 0);
            let v = col0.clone().subtract(e.clone().multiply((Math.sign(col0.data[0]) || 1) * col0.norm())); 
            let vvt = v.clone().multiply(v.clone().transpose());
    
            let H = v.clone().transpose().multiply(v).data[0];
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
       
            let upperSquare = R.clone().get((row,ix) => ix < R.data[0].length, null);
            let lowerRectangle = R.clone().get((row,ix) => ix >= R.data[0].length, null);
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
                this.clone().round(roundDigits).equals(
                    Q.clone().multiply(R).round(roundDigits)
                )
        };

    }

    eigen(errorThreshold = 1e-8, maxIterations = 1000) {

        let A = this.clone();
        let values = A.clone();
        let vectors = matrix.identity(A.data.length);

        let test = () => {
            for (let i = 0; i < vectors.data.length; i++) {
                let AV = A.clone().multiply(vectors.clone().get(null, i));
                let VV = vectors.clone().get(null, i).multiply(values.data[i][i]);
                 if (!AV.equals(VV, errorThreshold))
                    return false;
            }
            return true;
        }        

        let iterations = 0;
        for (let i = 1; i <= maxIterations; i++) {
            iterations++;
            let QR = values.clone().decompose('qr');
            values = QR.R.multiply(QR.Q);
            vectors = vectors.multiply(QR.Q);
            if (test())
                break;
            if (iterations == maxIterations) {
                matrix.logMany({values}, 'failing objects', 8)
                throw `Eigenvalues did not converge to a diagonal matrix within ${maxIterations} iterations.`;
            }
        }
        
        return {
            iterations,
            data: A,
            values: values.diagonal(true),
            vectors: vectors,
            test: test(6)
        };
    
    }

    eigen2(errorThreshold = 1e-8, maxIterations = 2) {

        // wilkinson shift: pi.math.cornell.edu/~web6140/TopTenAlgorithms/QRalgorithm.html

        let A = this.clone();
        let values = A.clone();
        let vectors = matrix.identity(A.data.length);
        let valuesLastIx = values.data.length - 1;

        let iterations = 0;
        for (let i = 1; i <= maxIterations; i++) {

            iterations++;
                        
            let wilk = (a,b,c) => {
                let sigma = (a-c)/2;
                return c - Math.sign(sigma) * Math.pow(b,2) / (Math.abs(sigma) + Math.pow(Math.pow(sigma,2)+Math.pow(b,2),0.5));
            };
            wilk = wilk(
                values.clone().get(valuesLastIx,valuesLastIx).data[0][0], 
                values.clone().get(valuesLastIx-1,valuesLastIx).data[0][0], 
                values.clone().get(valuesLastIx-1,valuesLastIx-1).data[0][0]
            );

            let QR = values.clone().multiply(matrix.identity(values.data.length).multiply(wilk)).decompose('qr');
            values = QR.R.multiply(QR.Q).add(matrix.identity(values.data.length).multiply(wilk));
            vectors = vectors.multiply(QR.Q);
/*
            if (values.clone().get(valuesLastIx -1, valuesLastIx).data[0][0] < errorThreshold)
                break;
            if (iterations == maxIterations) {
                matrix.logMany({values}, 'failing objects', 8)
                throw `Eigenvalues did not converge to a diagonal matrix within ${maxIterations} iterations.`;
            }
*/
        }
        
        console.log({
            iterations,
            eigen: values.clone().get(valuesLastIx, valuesLastIx).data[0][0]
        });

        /*
        return {
            iterations,
            data: A,
            values: values.diagonal(true),
            vectors: vectors
        };
        */
    
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
    
            if (g.isFunction(param)) {
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
    
        }
    
        rows = arrayify(rows, 'rows');
        cols = arrayify(cols, 'cols');
    
        let subset = [];
        for(let r of rows) {
            let row = [];
            for (let c of cols)
                row.push(this.data[r][c]);
            subset.push(row);
        }

        if (this.rowNames)
            this.rowNames = rows.map(rix => this.rowNames[rix]);
        if(this.colNames)
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
}

matrix.zeroes = function (numRows, numCols) { return matrix.repeat(0, numRows, numCols, false); }
matrix.ones = function (numRows, numCols) { return matrix.repeat(1, numRows, numCols, false); }
matrix.identity = function (numRows) { return matrix.repeat(1, numRows, numRows, true); }

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
                let val = g.random(this.lowVal, this.highVal, this.integers);
                row.push(val);
            }
            result.push(row);
        }
        return new matrix(result);
    }
}

matrix.logMany = (obj, objectTitle = 'object', roundDigits) => {

    console.log(`%c ---------- printing ${objectTitle} ----------`, 'color:red;margin-top:10px');

    let nonTables = {};
    let tables = [];

    for (let key of Object.keys(obj)) 
        if(obj[key] instanceof matrix) {
            tables.push({
                titleFunc: () => console.log('%c Matrix For: ' + key, 'color:orange;font-weight:bold;margin-top:10px'),
                tableFunc: () => obj[key].log(roundDigits) 
            })
        }
        else if (Array.isArray(obj[key]) || typeof obj[key] === 'object') {
            tables.push({
                titleFunc: () => console.log('%c Array/Object For: ' + key, 'color:orange;font-weight:bold;margin-top:10px'),
                tableFunc: () => console.table(obj[key])
            })
        } 
        else if (typeof obj[key] !== 'function') {
            nonTables[key] = obj[key];
        }
    
    if (Object.keys(nonTables).length > 0) {
        console.log('%c Primitives:', 'color:green;font-weight:bold;margin-top:10px');
        console.table(nonTables);
    }

    for(let table of tables) {
        table.titleFunc();
        table.tableFunc();
    }

    console.log(`%c ---------- done printing ${objectTitle} ----------`, 'color:red;margin-top:10px');

}