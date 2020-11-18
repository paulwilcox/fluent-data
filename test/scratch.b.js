async function test () {

    let A = new $$.matrix([
        [1, -1,  4],
        [1,  4, -2],
        [1,  4,  2],
        [1, -1,  0]
    ]);
    
    let result = A.decompose('qr');

    console.log({
        A: result.A.data,
        Q: result.Q.data,
        R: result.R.data,
        test: result.test()
    })
    
    return true;

}
