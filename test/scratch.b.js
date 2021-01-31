
async function test () {

    // initializations
        
        let mx = new $$.matrix([
            [3, 8, 7, 9],
            [4, 6, 2, 1],
            [9, 3, 5, 5],
            [1, 2, 4, 2]
        ]);

        let result;

    // qr decomposition

        for (let r = 2; r < 10; r++)
        for (let c = 2; c < 10; c++) {

            let mxType = r == 9 && c == 9 ? 'hard-coded' : 'random';
            mx = mxType == 'hard-coded'
                ? new $$.matrix([[1, -1,  4], [1,  4, -2], [1,  4,  2], [1, -1,  0]])
                : new $$.matrix.randomizer().setSize(r,c).setValues(-10,10).get();

            let d = mx.decompose('qr');    
            if (!d.test(4)) {
                console.log(
                    'Failed QR decomposition results follow',
                    {
                        A: d.A.data,
                        Q: d.Q.data,
                        R: d.R.data,
                        QR: d.Q.clone().multiply(d.R).data,
                        test: d.test(4)
                    }
                );
                throw `${mxType} ${r}x${c} matrix QR decomposition resulted in Q*R <> A.`;
            }

        }

    // terminations

        return true;

}


_decomposeQR() {

    // example: www.cs.nthu.edu.tw/~cherung/teaching/2008cs3331/chap4%20example.pdf
    // properties: en.wikipedia.org/wiki/QR_decomposition

    let R = this.clone();
    let Q;
/*
    if (this.data.length < this.data[0].length)
        throw   `Matrix has more columns (${this.data[0].length}) than rows (${this.data.length}).  ` + 
                `Cannot take the Household transform.`;
*/
    let cycle = (level = 0) => {
            
        if (level >= this.data.length - 1)
            return;

        let Rsub = R.clone().get((row,ix) => ix >= level, (col,ix) => ix >= level);
        if (Rsub.data[0].length == 0) 
            throw `QR decomposition did not converge in time to produce an upper triangular R.`;
        let col0 = Rsub.clone().get(null, 0);
        let e = matrix.identity(Rsub.data.length).get(null, 0);
        let v = col0.clone().subtract(e.clone().multiply((Math.sign(col0.data[0]) || 1) * col0.norm())); 
        let vvt = v.clone().multiply(v.clone().transpose());

        let H = v.clone().transpose().multiply(v).data[0];
        H = 2 / H;
        H = vvt.clone().multiply(H);
        H = matrix.identity(H.data[0].length).subtract(H);
        let I = matrix.identity(H.data[0].length + level);
        for (let r = level; r < I.data.length; r++)
        for (let c = level; c < I.data[0].length; c++) 
            I.data[r][c] = H.data[r-level][c-level];
        H = I;

        R = H.clone().multiply(R);
        Q = Q == null ? H : Q.multiply(H);
   
        let upperSquare = R.clone().get((row,ix) => ix < R.data[0].length, null);
        let lowerRectangle = R.clone().get((row,ix) => ix >= R.data[0].length, null);
        let lowerIsZeroes = !lowerRectangle.round(10).data.some(row => row.some(cell => cell != 0));

        if (upperSquare.isUpperTriangular(1e-10) && lowerIsZeroes)
            return;

        cycle(++level);

    };

    cycle();
    
    return { 
        A: this, 
        R, 
        Q, 
        test: (roundDigits = 8) => 
            this.clone().round(roundDigits).equals(
                Q.clone().multiply(R).round(roundDigits)
            )
    };

}