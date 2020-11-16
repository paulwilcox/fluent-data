async function test () {

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

    console.log({
        A1: A1.data,
        sign,
        norm,
        e1: e1.data,
        v1: v1.data
    })

    return true;

}
