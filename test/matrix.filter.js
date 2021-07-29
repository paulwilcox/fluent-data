async function test () {

    let mx = 
        new $$.matrix([
            [3, 8, 7, 9],
            [4, 6, 2, 1],
            [9, 3, 5, 5],
            [1, 2, 4, 2]
        ])
        .setRowNames('r0,r1,r2,r3')
        .setColNames('c0,c1,c2,c3');

    compare(
        '[0,1], [2,3]',
        mx.filter([0,1], [2,3]),
        make([[7,9],[2,1]], 'r0,r1', 'c2,c3')
    );

    compare(
        'null, [2,3]',
        mx.filter(null, [2,3]),
        make([[7,9], [2,1], [5,5], [4,2]], 'r0,r1,r2,r3', 'c2,c3')
    );
    
    compare(
        '[3,2,1,0], [1,1]',
        mx.filter([3,2,1,0], [1,1]),
        make([[2,2], [3,3], [6,6], [8,8]], 'r3,r2,r1,r0', 'c1,c1')
    );

    compare(
        '[-1,-2], [-1,-2]',
        mx.filter([-1,-2], [-1,-2]),
        make([[3,9], [1,2]], 'r0,r3','c0,c3')
    );

    compare(
        '(ix,row) => Math.max(...row) >= 5, null',
        mx.filter((ix,row) => Math.max(...row) >= 5, null),
        make([[3,8,7,9], [4,6,2,1], [9,3,5,5]], 'r0,r1,r2', 'c0,c1,c2,c3')
    );

    compare(
        `['r0','r3'], ['c0','c3']`,
        mx.filter(['r0','r3'], ['c0','c3']),
        make([[3,9],[1,2]], 'r0,r3', 'c0,c3')
    );

    try {
        mx.filter([8,9], [7,8])
    }
    catch(err) {
        if(!err.includes('outside the bounds of the matrix'))
            throw `Matrix.filter([8,9], [7,8]) did not throw an out of bounds error.`;
    }

    return true;

}

function compare(getType, matrixA, matrixB) {
    if(!matrixA.equals(matrixB, false))
        throw `Matrix.filter(${getType}) has unexpected result.`;
}

function make (array, rn, cn) {
    return new $$.matrix(array).setRowNames(rn).setColNames(cn);
}