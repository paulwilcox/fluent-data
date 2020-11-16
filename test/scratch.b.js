async function test () {

    // www.cs.nthu.edu.tw/~cherung/teaching/2008cs3331/chap4%20example.pdf

    let A = new $$.matrix([
        [1, -1,  4],
        [1,  4, -2],
        [1,  4,  2],
        [1, -1,  0]
    ]);

    let Acol1 = A.clone().get(null, 0);
    let e1 = $$.matrix.identity(A.data.length).get(null, 0);
    let v1 = Acol1.subtract(e1.multiply(Math.sign(Acol1.data[0]) * Acol1.norm())); 
    let v1v1t = v1.clone().multiply(v1.clone().transpose());

    let H = v1.clone().transpose().multiply(v1).data[0];
    H = 2 / H;
    H = v1v1t.clone().multiply(H);
    H = $$.matrix.identity(H.data[0].length).subtract(H);

    // Same as H * A, but presumably more performant
    let Anext = v1v1t.clone();
    Anext = Anext.multiply(0.5).multiply(A);
    Anext = A.clone().subtract(Anext);

    console.log({
        A: A.data,
        v1: v1.data,
        H: H.data,
        Anext: Anext.data,  
    })

    return true;

}
