
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
console.log(multiplied)

/*
    let matrix = new Matrix();
    matrix.data = [
        [1, -1, 2],
        [0, -3, 1]
    ];

    let multiplied = matrix.multiply([2, 1, 0]);

    console.log(multiplied);

*/