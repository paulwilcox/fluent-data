async function test () {

    let mx = new $$.matrix.randomizer().setSize(4,3).setValues(-1, 9).get().round(4);
    let d = mx.decompose('qr');

    // TODO: Add round capacity to matrix.decompose.test() so that minute errors don't fail.
    console.log({
        A: d.A.data,
        Q: d.Q.data,
        R: d.R.data,
        QR: d.Q.clone().multiply(d.R).data,
        test: d.test()
    })

    return;

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
