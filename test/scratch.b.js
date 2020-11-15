import * as g from '../src/general.js';

async function test () {

    let mx = [
        [3, 8, 7, 9],
        [4, 6, 2, 1],
        [9, 3, 5, 5],
        [1, 2, 4, 2]
    ];

    let rows = 1; // 1, [3,1,2], [false,true,true,false], (row, rowIx) => row[0] > rowIx, -1, [-2,-1]
    let cols = 2; // same 

    let allRows = [...Array(mx.length).keys()];
    let allCols = [...Array(mx[0].length).keys()];

    // Turn rows or cols parameters into array form (unless it's a function).
    // > 1 turns into [1],
    // > [false,true,true,false] turns into [1,2]
    // > [-2,-1] turns into [0,3] for 'row' direction and matrix having 4 rows  
    let arrayify = function (param, direction) {

        // convert int form to int array form
        if (typeof param === 'number')
            param = [param];

        if (Array.isArray(param) && param.length >= 0) {
            
            // convert boolean form to int array form
            if (typeof param[0] === 'boolean')
                param = param
                    .map((row,ix) => row === true ? ix : undefined)
                    .filter(row => row != undefined);

            if (typeof param[0] === 'number') {

                // make sure all numbers are integers
                param = param.map(row => Math.round(row));

                // deal with negative numbers
                let positives = param.filter(row => row >= 0);
                if (positives.length == 0)  // if only negatives, then make the full range and exclude the negatives
                    param = (direction == 'rows' ? allRows : allCols)
                        .filter(num => !param.includes(-num));
                else if (positives.length < param.length) // if some positives, then just exclude the negatives
                    param = positives;

            }

            if (g.isFunction(param)) {
                let _param = [];
                if (direction == 'rows')
                    for(let r = 0; r < mx.length; r++)
                        if (param(mx[r], r))
                            _param.push(r);
                else 
                    for(let c = 0; c < mx[0].length; c++) {
                        let transposed = [];
                        for(let r = 0; r < mx.length; r++)
                            transposed.push(mx[r][c]);
                        if(param(transposed, c))
                            _param.push(c);
                    }
                param = _param;
            }

        }

        return param;

    }

    /*
    let result = [];
    for(let r of rows) {
        let row = [];
        for (let c of rows[r])
            row.push(rows[r][c]);
        result.push(row);
    }
    return result;
    */
   
    return true;

}
