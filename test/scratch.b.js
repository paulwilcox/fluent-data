async function test () {

    // example: cs.nthu.edu.tw/~cherung/teaching/2008cs3331/chap4%20example.pdf
    // properties: en.wikipedia.org/wiki/QR_decomposition

    let A = new $$.matrix([
        [1, -1,  4],
        [1,  4, -2],
        [1,  4,  2],
        [1, -1,  0]
    ]);

    let R = A.clone();
    let Q;

    if (A.data.length <= A.data[0].length)
        throw   `Matrix has more columns (${A.data[0].length} than rows (${A.data.length}).  ` + 
                `Cannot take the Household transform.`;

    let cycle = (level = 0) => {
            
        if (level >= A.data.length - 1)
            return;

        let Rsub = R.clone().get((row,ix) => ix >= level, (col,ix) => ix >= level);
        let col0 = Rsub.clone().get(null, 0);
        let e = $$.matrix.identity(Rsub.data.length).get(null, 0);
        let v = col0.clone().subtract(e.clone().multiply((Math.sign(col0.data[0]) || 1) * col0.norm())); 
        let vvt = v.clone().multiply(v.clone().transpose());

        let H = v.clone().transpose().multiply(v).data[0];
        H = 2 / H;
        H = vvt.clone().multiply(H);
        H = $$.matrix.identity(H.data[0].length).subtract(H);
        let I = $$.matrix.identity(H.data[0].length + level);
        for (let r = level; r < I.data.length; r++)
        for (let c = level; c < I.data[0].length; c++) 
            I.data[r][c] = H.data[r-level][c-level];
        H = I;

        // Same as H * A, but presumably more performant.  
        // But I don't want to implement it yet.
        //   let HA = vvt.clone();
        //   HA = HA.multiply(0.5).multiply(Asub);
        //   HA = Asub.clone().subtract(HA);
        //   A = HA;       
        R = H.clone().multiply(R);
        Q = Q == null ? H : Q.multiply(H);
   
        let upperSquare = R.clone().get((row,ix) => ix < R.data[0].length, null);
        let lowerRectangle = R.clone().get((row,ix) => ix >= R.data[0].length, null);
        let lowerIsZeroes = !lowerRectangle.data.some(row => row.some(cell => cell != 0));

        if(upperSquare.isUpperTriangular() && lowerIsZeroes) {
            return;
        }
            
        cycle(++level);

    };

    cycle();
    
    console.log({
        A: A.data,
        R: R.data, 
        Q: Q.data,
        test: Q.multiply(R).data
    });
    
    return true;

}
