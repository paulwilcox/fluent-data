
async function test () {

    let mx = new $$.matrix([
        [3, 8, 7, 9],
        [4, 6, 2, 1],
        [9, 3, 5, 5],
        [1, 2, 4, 2]
    ]);

    if (mx.determinant() != 909)
        throw `Matrix determinant is ${mx.determinant()}, 909 expected.`;

    if ($$.round(mx.norm(),5) != 20.61553)
        throw `Matrix frobenian/euclidian norm is ${mx.norm()}, 20.61553 expected.`;

    if (mx.norm(1) != 19)
        throw `Matrix 1-norm is ${mx.norm(1)}, 19 expected.`;

    if (mx.norm('infinity') != 27)
        throw `Matrix infinity-norm is ${mx.norm('infinity')}, 27 expected.`;

    return true;

}
