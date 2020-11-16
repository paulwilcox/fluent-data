async function test () {

    // www.cs.nthu.edu.tw/~cherung/teaching/2008cs3331/chap4%20example.pdf

    let A = new $$.matrix([
        [1, -1,  4],
        [1,  4, -2],
        [1,  4,  2],
        [1, -1,  0]
    ]);

    let A1 = A.get(null, 0);
    let sign = Math.sign(A.data[0][0]);
    let norm = A1.norm();
    let e1 = $$.matrix.identity(A.data.length).get(null, 0);
    let v1 = A1.subtract(e1.multiply(sign * norm)); 

    let H = v1.clone().transpose().multiply(v1).data[0];
    H = 2 / H;
    H = v1.clone().multiply(v1.clone().transpose()).multiply(H);
    H = $$.matrix.identity(H.data[0].length).subtract(H);

    console.log({
        A1: A1.data,
        sign,
        norm,
        e1: e1.data,
        v1: v1.data,
        H: H.data
    })

    return true;

}
