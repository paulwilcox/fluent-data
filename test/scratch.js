
let data = [
    { cases: 7, distance: 560, time: 16.68 },
    { cases: 3, distance: 220, time: 11.50 },
    { cases: 3, distance: 340, time: 12.03 },
    { cases: 4, distance: 80, time: 14.88 },
    { cases: 6, distance: 150, time: 13.75 },
    { cases: 7, distance: 330, time: 18.11 }
];

class Matrix {

    constructor () {
        this.data = [];
    }

    insert(data, rowFunc, names) {
        if (data.length > 0 && !Array.isArray(rowFunc(data[0])))
            throw 'rowFunc does not seem to return an array.';
        this.names = names.map((name, ix) => ({ pos: [null, ix], val: name }));
        this.data = [...this.normalize(data.map(rowFunc))];
        return this;
    }

    arrayify () {
        return [...this._arrayify(this.data)];
    }

    transpose(dimA = 1, dimB = 2) {
        dimA--;
        dimB--;
        for(let row of this.data) {
            let da = row.pos[0];
            let db = row.pos[1];
            row.pos[dimA] = db;
            row.pos[dimB] = da;
        }
        return this;
    }

    *_arrayify(input) {

        if (input.length == 0) 
            yield* input;

        else if (input.length == 1) 
            yield* input[0].val;

        else {

            let results = {};

            for(let entry of input) {
                let pos = [...entry.pos];
                pos.shift();
                let p = pos[pos.length - 1];
                if(results[p] === undefined)
                    results[p] = { pos, val: [entry.val] };
                else 
                    results[p].val.push(entry.val) 
            }

            yield* this._arrayify(Object.values(results))

        }

    }

    *normalize (input) {

        if (input && input.pos === undefined) 
            yield* this.normalize({ pos: [], val: input });

        else if (Symbol.iterator in Object(input.val) && typeof input.val !== 'string')
            for(let i in input.val) { 
                let n = parseInt(i);
                yield* this.normalize({ pos: [...input.pos, n], val: input.val[i] })
            }
        else 
            yield input;

    }

}


let matrix = new Matrix().insert(
    data, 
    row => [row.cases, row.distance],
    ['cases', 'distance']
);

console.log(matrix.arrayify())
console.log(matrix.transpose().arrayify())