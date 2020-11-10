import matrix from '../src/matrix.js';

async function test () {

    let mx = new matrix([
        [3, 8, 7, 9],
        [4, 6, 2, 1],
        [9, 3, 5, 5],
        [1, 2, 4, 2]
    ]);

    console.log(mx);

    console.log(mx.determinant());

    return true;

}
