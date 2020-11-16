async function test () {

    // www.cs.nthu.edu.tw/~cherung/teaching/2008cs3331/chap4%20example.pdf

    let A = new $$.matrix([
        [1, -1,  4],
        [1,  4, -2],
        [1,  4,  2],
        [1, -1,  0]
    ]);

    let col0 = A.clone().get(null, 0);
    let e = $$.matrix.identity(A.data.length).get(null, 0);
    let v = col0.subtract(e.multiply(Math.sign(col0.data[0]) * col0.norm())); 
    let vvt = v.clone().multiply(v.clone().transpose());

    let H = v.clone().transpose().multiply(v).data[0];
    H = 2 / H;
    H = vvt.clone().multiply(H);
    H = $$.matrix.identity(H.data[0].length).subtract(H);

    // Same as H * A, but presumably more performant
    let Anext = vvt.clone();
    Anext = Anext.multiply(0.5).multiply(A);
    Anext = A.clone().subtract(Anext);

    console.log({
        A: A.data,
        H: H.data,
        Anext: Anext.data,  
    })

    return true;

}
