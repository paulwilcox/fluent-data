import * as g from './general.js';

export default class matrix {

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
        if (g.isString(selector)) {
            this.colNames = selector.split(',').map(name => name.trim());
            selector = (row) => this.colNames.map(name => row[name]);
        }

        this.data = data.map(selector)

        if (rowNames)
            this.rowNames = g.isString(rowNames)
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
        if (g.isString(colNames))
            colNames = colNames.split(',').map(name => name.trim());
        if (mx.data.length > 0 && mx.data[0].length != colNames.length)
            throw `colNames is not of the same length as a row of data.`
        mx.colNames = colNames;
        return mx;
    }

    setRowNames (rowNames) {
        let mx = this.clone();
        if (g.isString(rowNames))
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

    log (
        element = null, 
        caption = null, 
        mapper = x => x, 
        limit = 50
    ) {

        let clone = this.clone();
        let printable = [];
        
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

        let printed = g.tableToString(printable, caption, mapper, limit);
        
        if (!element)
            console.log(printed);
        else {
            let div = document.createElement('div');
            div.style = 'white-space:pre; font-family:consolas; font-size:x-small'
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
        }
    
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

            for(let r = mx.data.length - 2; r >= onOrAfterIndex; r--) {

                let prev = mx.data[r];
                let cur = mx.data[r + 1];
                let prevLeader = leadingItem(prev);
                let curLeader = leadingItem(cur);
                let otherPrev = other[r];
                let otherCur = other[r + 1];

                let needsPromote = 
                    prevLeader.pos > curLeader.pos || 
                    (prevLeader.pos == curLeader.pos && prevLeader.val > curLeader.val)

                if (needsPromote) {
                    mx.data[r + 1] = cur;
                    mx.data[r] = prev;
                    other[r + 1] = otherCur;
                    other[r] = otherPrev;
                }
                
                prevLeader = curLeader;

            }

        }

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

            if (mx.data.length == 0 || other.length == 0) 
                throw 'cannot solve when either input is empty';

            if (mx.data.length != other.length)
                throw 'cannot solve when input lengths do not match';

        }

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
        } 
    
        let test = () => {
            D = D.get(id => id < r, id => id < r);
                return L.multiply(D).multiply(R.transpose()).equals(this, errorThreshold) 
            && L.transpose().multiply(L).equals(matrix.identity(L.data[0].length), errorThreshold)
            && R.transpose().multiply(R).equals(matrix.identity(R.data[0].length), errorThreshold)
            && D.isDiagonal(errorThreshold);
        }
    
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
            showObjects: (round) => {
                let logMx = (mx, name) => mx.log(null, name, row => g.round(row, 8));
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
                values = values.map(v => g.roundToMultiple(v, demoted));

        // caluclate vectors

            let vectors = [];
            let iterations = {
                values: eigenValsObj.iterations
            }

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
                    if (g.isString(err))
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
                values[v] = g.roundToMultiple(values[v], mergeThreshold);
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
    
            if (g.isString(param))
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
    
            if (g.isFunction(param)) {
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
    
        }
    
        let indexify = (array, names, direction) => {

            for(let i = 0; i < array.length; i++) {
                if (!g.isString(array[i]))
                    continue;
                if (!names)
                    throw `No names for ${direction} exists in order to match '${array[i]}'`;
                let ix = names.findIndex(item => array[i] == item);
                if (ix == -1)
                    throw `'${array[i]}' cannot be found in the collection of names for ${direction}.`;
                array[i] = ix; 
            }
            return array;
        }

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
}

matrix.zeroes = function (numRows, numCols) { return matrix.repeat(0, numRows, numCols, false); }
matrix.ones = function (numRows, numCols) { return matrix.repeat(1, numRows, numCols, false); }
matrix.identity = function (
    numRows, 
    numCols = null // null for numCols = numRows
) { 
    return matrix.repeat(1, numRows, numCols || numRows, true); 
}

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

class convergenceTracker {

    constructor (
        errorMin,
        convergenceFunc = null 
    ) {

        this.errorMin = errorMin;
        this.convergenceFunc = convergenceFunc || ((a,b) => Math.abs(a-b) <= this.errorMin);
        this.previousValue; 

        this.timeStart = Date.now();
        this.timeEnd;
        this.timeMax;

        this.iterations = [0];
        this.iterationsMax;
        this.iterationsPerRunMax;

    }

    get currentIterations () {
        return this.iterations[this.iterations.length - 1];
    }

    set currentIterations (val) {
        this.iterations[this.iterations.length - 1] = val;
    }

    setMaxTime(seconds) {
        this.timeMax = seconds;
        return this;
    }

    setMaxIterations(max,maxPerRun) {
        this.iterationsMax = max;
        this.iterationsPerRunMax = maxPerRun
        return this;
    }

    iterate (newRun = false) {

        if (newRun)
            this.iterations.push(0);

        this.currentIterations = this.currentIterations + 1;
        this.timeEnd = Date.now();

        if (this.iterationsMax !== undefined && Math.sum(this.iterations) > this.iterationsMax)
            throw `'iterationsMax' limit of ${this.iterationsMax} reached without convergence.`;
        if (this.iterationsPerRunMax !== undefined && this.currentIterations > this.iterationsPerRunMax)
            throw `'iterationPerRunMax' limit of ${this.iterationsPerRunMax} reached without convergence.`;
        if (this.timeMax !== undefined && (this.timeEnd - this.timeStart) / 1000 > this.timeMax)
            throw `'timeMax' limit of ${this.timeMax} seconds reached without convergence.`;

        return true;

    }

    // If one value is passed, a system of checking a current value 
    // to a stored previous value is made.
    // If two values are passed, they're compared directly.
    checkConvergence(...args) {

        if (args.length == 2)
            return this.convergenceFunc(args[0], args[1]);
        else if (args.length == 1) {
            let result = this.convergenceFunc(this.previousValue, this.args[0]);
            this.previousValue = args[0];
            return result;
        }
        else throw 'Invalid number of arguments passed to checkConvergence().';

    }

}