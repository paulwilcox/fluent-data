
async function test () {

    // initializations
        
        let mx = new $$.matrix([
            [3, 8, 7, 9],
            [4, 6, 2, 1],
            [9, 3, 5, 5],
            [1, 2, 4, 2]
        ]);

    // determinant

        if (mx.determinant() != 909)
            throw `Matrix determinant is ${mx.determinant()}, 909 expected.`;

    // round

        if ($$.round(mx.norm(),5) != 20.61553)
            throw `Matrix frobenian/euclidian norm is ${mx.norm()}, 20.61553 expected.`;

    // norms

        if (mx.norm(1) != 19)
            throw `Matrix 1-norm is ${mx.norm(1)}, 19 expected.`;

        if (mx.norm('infinity') != 27)
            throw `Matrix infinity-norm is ${mx.norm('infinity')}, 27 expected.`;

    // structure checks

        mx = new $$.matrix([[1, 0, 0], [4, 5, 0], [7, 8, 9]]);
        if (!mx.isLowerTriangular())
            throw `Lower trianguar matrix not identified as such`;

        mx = new $$.matrix([[1, 2, 3], [0, 5, 6], [0, 0, 9]]);
        if (!mx.isUpperTriangular())
            throw `Upper trianguar matrix not identified as such`;

    // decomposition

        for (let r = 2; r < 10; r++)
        for (let c = 2; c <= r; c++) {
            let mxType = r == 9 && c == 9 ? 'hard-coded' : 'random';
            mx = mxType == 'hard-coded'
                ? new $$.matrix([[1, -1,  4], [1,  4, -2], [1,  4,  2], [1, -1,  0]])
                : new $$.matrix.randomizer().setSize(r,c).setValues(-10,10).get();
            let d = mx.decompose('qr');    
            if (!d.test(4)) {
                console.log(
                    'Failed QR decomposition results follow',
                    {
                        A: QRresult.A.data,
                        Q: QRresult.Q.data,
                        R: QRresult.R.data,
                        QR: QRresult.Q.clone().multiply(QRresult.R).data,
                        test: QRresult.test(4)
                    }
                );
                throw `${mxType} ${r}x${c} matrix QR decomposition resulted in Q*R <> A.`;
            }
        }
    
    // terminations

        return true;

}
