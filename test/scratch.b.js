import matrix from '../src/matrix.js';

async function test () {

    let mx = [
        [3, 8, 7, 9],
        [4, 6, 2, 1],
        [9, 3, 5, 5],
        [1, 2, 4, 2]
    ];

    console.log(mx);

    console.log(determinant(mx));

    return true;

}

function determinant (data) {

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
        let det = determinant(subset);
        sum += sign * data[0][cTop] * det;
    }

    return sum;

}