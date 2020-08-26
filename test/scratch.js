
let data = [
    { cases: 7, distance: 560, time: 16.68 },
    { cases: 3, distance: 220, time: 11.50 },
    { cases: 3, distance: 340, time: 12.03 },
    { cases: 4, distance: 80, time: 14.88 },
    { cases: 6, distance: 150, time: 13.75 },
    { cases: 7, distance: 330, time: 18.11 }
];

class Matrix {

    constructor (data, rowFunc, names) {

        if (!data)
            return this;

        if (data.length > 0 && !Array.isArray(rowFunc(data[0])))
            throw 'rowFunc does not seem to return an array.';

        this.colNames = names;
        this.rowNames = null;
        this.data = data.map(rowFunc);
        
    }

    clone() {
        let result = [];
        for(let row of this.data) {
            let newRow = [];
            for (let cell of row) 
                newRow.push(cell);
            result.push(newRow);
        }
        let matrix = new Matrix();
        matrix.data = result;
        matrix.colNames = this.colNames;
        matrix.rowNames = this.rowNames;
        return matrix;
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

        else if (other instanceof Matrix) {
            // I don't know if I really have to blot out the names.
            this.rowNames = null;
            this.colNames = null;
            this.data = this._multiplyMatrix(other);
        }

        return this;

    }

    inverse() {

        let leadingItem = (row) => {
            for(let c in row) 
                if (row[c] != 0)
                    return { pos: c, val: row[c] };
            return { pos: -1, val: null }
        }

        let rowMultiply = (row, multiplier) => {
            for(let c in row) {
                row[c] *= multiplier;
                if (row[c] == -0)
                    row[c] = 0
            }
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

            for(let r = this.data.length - 1; r >= onOrAfterIndex; r--) {

                let prev = this.data[r + 1];
                let cur = this.data[r];
                let prevLeader = leadingItem(prev);
                let curLeader = leadingItem(cur);

                let needsPromote = 
                    prevLeader.pos > curLeader.pos || 
                    (prevLeader.pos == curLeader.pos && prevLeader.val > curLeader.val)

                if (needsPromote) {
                    this.data[r + 1] = cur;
                    this.data[r] = prev;
                }
                
                prevLeader = curLeader;

            }

        }

        let subtractTopMultiple = (onOrAfterIndex) => {
                
            let topLead = leadingItem(this.data[onOrAfterIndex]);

            rowMultiply(this.data[onOrAfterIndex], 1 / topLead.val);

            for(let r = onOrAfterIndex + 1; r < this.data.length; r++) {
                let row = this.data[r];
                let counterpart = row[topLead.pos];
                if (counterpart == 0)
                    continue;
                let multipliedRow = rowMultiply(
                    clone(this.data[onOrAfterIndex]), 
                    -counterpart
                );
                rowAdd(this.data[r], multipliedRow);
            }

        }

        for (let i = 0; i < this.data.length; i++) {
            sort(i);
            subtractTopMultiple(i);
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
            throw   `Left matrix has ${this.data[0].length + 1} columns.  ` + 
                    `Right matrix has ${other.data.length + 1} rows.  ` + 
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

}


let matrix = new Matrix(
    data, 
    row => [1, row.cases, row.distance],
    ['dummy', 'cases', 'distance']
);

let multiplied = matrix.clone().transpose().multiply(matrix);
let x = multiplied.data[0];
let y = multiplied.data[1];
multiplied.data[0] = x;
multiplied.data[1] = y;
console.log(multiplied.data)

let inversed = multiplied.clone().inverse();
console.log(inversed.data);
