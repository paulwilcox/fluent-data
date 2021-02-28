
async function test () {

    // initializations
        
        let mx = new $$.matrix([
            [3, 8, 7, 9],
            [4, 6, 2, 1],
            [9, 3, 5, 5],
            [1, 2, 4, 2]
        ]);

        let result;

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
    
    // pseudoInverse
        
        mx = new $$.matrix([
            [  8.0, 7.3, -5,   2],
            [  4.0, 8.4,  4, -36],
            [-43.5, 2.9, -3, -22],
            [ 84.2, 8.8, -7,  15],
            [-12.3, 6.5,  6,  14],
            [ 23.3, 4.5,  6,  -8],
            [ 32.8, 7.4, -1,  10]
        ]);

        result = mx.pseudoInverse()
            .multiply(mx).round(8)
            .equals($$.matrix.identity(4));

        if (!result) 
            throw 'pseudoInverse multiplied by original did not produce identity matrix.';

    // terminations

        return true;

}
