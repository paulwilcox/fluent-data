async function test () {

    // TODO: matrix.get zero-length inputs and outputs.

    let mx = 
        new $$.matrix([
            [3, 8, 7, 9],
            [4, 6, 2, 1],
            [9, 3, 5, 5],
            [1, 2, 4, 2]
        ])
        .setRowNames('r0,r1,r2,r3')
        .setColNames('c0,c1,c2,c3');

    console.log({
        mx,
        arr: mx.clone().get([0,1], [2,3]),
        halfArr: mx.clone().get(null, [2,3]),
        func: mx.clone().get(row => Math.max(...row) >= 5, null),
        rev: mx.clone().get([3,2,1,0],[3,2,1,0]),
        rep: mx.clone().get([0,0],[0,0]),
        rm: mx.clone().get([-0,-1],[-0,-1])
    });
    
    mx.clone().get([8,9], [7,8])

    return true;

}
