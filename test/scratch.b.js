async function test () {

    let A = 
        new $$.matrix([
            [1, -1,  4],
            [1,  4, -2],
            [1,  4,  2],
            [1, -1,  0]
        ]);

    let A1 = A.get(null, 0);

    console.log(A1)

    return true;

}
