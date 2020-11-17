async function test () {

    // example: cs.nthu.edu.tw/~cherung/teaching/2008cs3331/chap4%20example.pdf
    // properties: en.wikipedia.org/wiki/QR_decomposition

    let A = new $$.matrix([
        [1, -1,  4],
        [1,  4, -2],
        [1,  4,  2],
        [1, -1,  0]
    ]);

    if (A.data.length <= A.data[0].length)
        throw   `Matrix has more columns (${A.data[0].length} than rows (${A.data.length}).  ` + 
                `Cannot take the Household transform.`;

    let Aorig = A.clone();
    let Hs = [];

    let cycle = (level = 0) => {
            
        if (level >= A.data.length - 1)
            return;

        let Asub = A.clone().get((row,ix) => ix >= level, (col,ix) => ix >= level);
        let col0 = Asub.clone().get(null, 0);
        let e = $$.matrix.identity(Asub.data.length).get(null, 0);
        let v = col0.clone().subtract(e.clone().multiply((Math.sign(col0.data[0]) || 1) * col0.norm())); 
        let vvt = v.clone().multiply(v.clone().transpose());

        let H = v.clone().transpose().multiply(v).data[0];
        H = 2 / H;
        H = vvt.clone().multiply(H);
        H = $$.matrix.identity(H.data[0].length).subtract(H);
        Hs.push(H);

        // Same as H * Asub, but presumably more performant
        let HA = vvt.clone();
        HA = HA.multiply(0.5).multiply(Asub);
        HA = Asub.clone().subtract(HA);
        
        for (let r = level; r < HA.data.length; r++)
        for (let c = level; c < HA.data[0].length; c++) 
            A.data[r+level][c+level] = HA.data[r][c];

        console.log({
            level,
            A: A.clone().data
        })
        if (A.isUpperTriangular())
            return;

        cycle(++level);

    };

    // TODO: Needs a stopper when HA is upper triangular.
    cycle();

    console.log({
        Aorig: Aorig.data,
        A: A.data,
        Hs: Hs.map(h => h.data)
    })

    return true;

}
