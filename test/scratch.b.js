async function test () {

    for (let r = 2; r < 10; r++)
    for (let c = 2; c <= r; c++) {
        let mx, d;
        try {
            mx = new $$.matrix.randomizer().setSize(r,c).setValues(-10,10).get();
            d = mx.decompose('qr');    
        }
        catch(e) {
            throw `Random ${r}x${c} matrix QR decomposition resulted in an error (text follows).  ${e}`;
        }
        if (!d.test(4)) {
            logDecomposition(d);
            throw `Random ${r}x${c} matrix QR decomposition resulted in Q*R <> A.`;
        }
    }

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

function logDecomposition (QRresult) {
    console.log('Failed QR decomposition results follow');
    console.log({
        A: QRresult.A.data,
        Q: QRresult.Q.data,
        R: QRresult.R.data,
        QR: QRresult.Q.clone().multiply(QRresult.R).data,
        test: QRresult.test(4)
    })

}