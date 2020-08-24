
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
            result.push([]);
            for (let cell of row) 
                result[result.length - 1].push(cell);
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

        this.rowNames = null;
        this.colNames = null;

        if (other instanceof Matrix)
            this.data = this._matrixMultiply(other);

        return this;

    }

    _matrixMultiply(other) {

        let result = [];

        let otherLastColIx = other.data[0].length - 1;

        for (let r in this.data) {
            result.push([]);
            for(let oCol = 0; oCol <= otherLastColIx; oCol++) {
                let agg = 0;
                for (let ix in this.data[r]) {
                    agg += this.data[r][ix] * other.data[ix][oCol];
                }
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
console.log(multiplied)