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



    return true;

}
