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

    isDiagonal(zeroThreshold = 0) {
        for (let r = 0; r < this.data.length; r++)
        for (let c = 0; c < this.data[0].length; c++)
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
        let svd = this.decompose('svd.compact', ...args);
        let inv = svd.D.clone().apply(x => x == 0 ? 1e32 : x == -0 ? -1e32 : 1/x).diagonal();
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
    solve(
        other,
        fullyReduce = true,
        returnAllObjects = false
    ) {

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
            if (!fullyReduce && this.isUpperTriangular()) 
                break;
        }

        if (!returnAllObjects) {
            this.data = other;
            return this;
        }

        return {
            A: this,
            other: new matrix(other)
        }

    }

    // TODO: incorporate errorThreshold and maxIterations into QR and LU decompositions
    decompose(method, errorThreshold, maxIterations) {

        method = method.toLowerCase();

        if (method == 'qr')
            return this._decomposeQR();

        else if (method == 'lu')
            return this._decomposeLU();

        else if (method == 'svd.compact')
            return this._decomposeSVDcompact(
                errorThreshold || 1e-8, 
                maxIterations || 1000
            );

        else 
            throw `Decompose method '${method}' not recognized.`;

    }

    _decomposeQR() {

        // example: www.cs.nthu.edu.tw/~cherung/teaching/2008cs3331/chap4%20example.pdf
        // properties: en.wikipedia.org/wiki/QR_decomposition

        let R = this.clone();
        let Q;
    /*
        if (this.data.length < this.data[0].length)
            throw   `Matrix has more columns (${this.data[0].length}) than rows (${this.data.length}).  ` + 
                    `Cannot take the Household transform.`;
    */
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

    _decomposeLU() {

        let m = this.data.length - 1;
        let U = this.clone();
        let L = matrix.identity(m + 1);
    
        for (let k = 0; k < m; k++)
        for (let j = k + 1; j <= m; j++) {
            L.data[j][k] = U.data[j][k]/U.data[k][k];
            let term = U.clone().get(j,(col,ix) => ix >= k && ix <= m).subtract(
                U.clone().get(k,(col,ix) => ix >= k && ix <= m).multiply(L.data[j][k])
            ).data[0];
            console.log(JSON.stringify(term))
            for (let i = k; i <= m; i++)
                U.data[j][i] = term[i];
        }
        
        return { 
            A: this, 
            L, 
            U, 
            test: (roundDigits = 8) => 
                this.clone().round(roundDigits).equals(
                    L.clone().multiply(U).round(roundDigits)
                )
        };
        
    }

    // hal.archives-ouvertes.fr/hal-01927616/file/IEEE%20TNNLS.pdf
    // pfister.ee.duke.edu/courses/ecen601/notes_ch8.pdf
    //   - p129 describes the full vs compact SVD (this and R does the compact)
    _decomposeSVDcompact(errorThreshold, maxIterations) {

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
            D.multiply(Id);
            R.multiply(Ir);
        } 
    
        let test = () => {
            D = D.get((row,id) => id < r, (col,id) => id < r);
                return L.clone().multiply(D).multiply(R.clone().transpose()).equals(this, errorThreshold) 
            && L.clone().transpose().multiply(L).equals(matrix.identity(L.data[0].length), errorThreshold)
            && R.clone().transpose().multiply(R).equals(matrix.identity(R.data[0].length), errorThreshold)
            && D.isDiagonal(errorThreshold);
        }
    
        let iterations = 0;
        while (++iterations <= maxIterations) {

            L = this.clone()
                .multiply(R.clone().transpose())
                .decompose('qr').Q
                .get(null,(col,ix) => ix >= 0 && ix <= r - 1);
    
            let qr = this.clone().transpose().multiply(L).decompose('qr');
            R = qr.Q.clone().get(null,(col,ix) => ix >= 0 && ix <= r - 1).transpose();
            D = qr.R.clone().transpose();
    
            if (iterations % 10 == 0) {
                R.transpose();
                signCorrect();
                if (test()) 
                    return { iterations, A: this, L, D, R };
                R.transpose();
            }
    
        }
    
        R.transpose();
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

            // Sort in order of dominance.  But maybe 
            // consider sorting in normal order? 
            eigenValsObj.values.sort((a,b) => 
                Math.abs(a) < Math.abs(b) ? 1
                : Math.abs(a) > Math.abs(b) ? -1
                : b - a
            );

            eigenValsObj.rawValues = eigenValsObj.values.map(v => v);

            // if a multiplicity is detected, average out the multiples
            if (params.valueMerge)
                this._eigen_mergeVals(eigenValsObj.values, params.valueMerge); 

            // Final rounding of eigenvals (one less precision than the stopThreshold).

                // In one case, I've noticed this helps in the vector creation and testing phases 
                // because the rounding can bring the estimates to their exact figure, expecially
                // when the exact figures are integers or otherwise fairlry 'clean' numbers.   

                let [str, precision] = params.valueThreshold.toExponential().split('e');
                let demoted = parseFloat(str + 'e' + (parseInt(precision) + 1).toString());
                
                eigenValsObj.values = eigenValsObj.values.map(v => 
                    g.roundToMultiple(v, demoted)
                );

        // caluclate vectors

            let vectors = [];
            let iterations = {
                forValues: eigenValsObj.iterations,
                forVectors: []
            }

            for(let v = 0; v < eigenValsObj.values.length; v++) {
                let eigenVectObj; 
                try { 
                    eigenVectObj = this._eigen_getVect(
                        A, 
                        eigenValsObj.values[v], 
                        params.vectorThreshold, 
                        params.vectorLoopMax
                    );
                }
                catch(err) {
                    err.eigenValsObj = eigenValsObj;
                    err.eigenValsObj.about = 
                        'This eigenValsObj represents successfull iteration of eigenvalues.  ' +
                        'It is just for completeness of information.  ' +
                        'It is an iteration for an eigenvector that has failed.  ';
                    throw err;
                }
                vectors.push(eigenVectObj.vector);
                iterations.forVectors.push(eigenVectObj.iterations);
            }

        // terminations

            let result = {
                values: eigenValsObj.values,
                vectors: new matrix(vectors).transpose(),
                iterations
            };

            if (params.testThreshold && !this._eigen_test(A, eigenValsObj.values, vectors, params.testThreshold)) {
                console.log({FailingObjects: result});
                throw   `Produced eigen values and vectors did not pass test.  ` +
                        `Failing objects precede. ` +
                        `You may have to increase the 'maxIterationsPerVector', or, more likey, ` +
                        `the 'threshold' or 'roundEigenValues' parameters.  ` +
                        `This is especially true if you have repeated eigenvalues. `;                    
            }

            return result;

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
    
            let QR = values.clone().decompose('qr');
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
        let M = A.clone().subtract(ei).pseudoInverse();

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
                let test = this._eigen_test(
                    A,
                    [eigenvalue],
                    new matrix([vector]),
                    threshold
                );
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

        for (let i = 0; i < vectors.data.length; i++) {
            let getVect = () => vectors.clone().transpose().get(null, i);
            let AV = origMatrix.clone().multiply(getVect());
            let VV = getVect().multiply(values[i]);
            if (!AV.equals(VV, errorThreshold, true))
                return false;
        }

        return true;

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

matrix.logMany = (obj, objectTitle = 'object', roundDigits) => {

    console.log(`%c ---------- printing ${objectTitle} ----------`, 'color:red;margin-top:10px');

    let nonTables = {};
    let tables = [];

    if (g.isString(obj)) 
        obj = { objectIsAString: obj };

    for (let key of Object.keys(obj)) 
        if(obj[key] == null || obj[key] == undefined) {
            // do nothing
        }
        else if(obj[key] instanceof matrix) {
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

    console.log(`%c ---------- done printing ${objectTitle} ----------`, 'color:red;margin-top:10px');

}