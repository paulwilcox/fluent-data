async function test () {
    
    let eigen = new $$.matrix([
        [1.00, 0.02, 0.96, 0.42, 0.01],
        [0.02, 1.00, 0.13, 0.71, 0.85],
        [0.96, 0.13, 1.00, 0.50, 0.11],
        [0.42, 0.71, 0.50, 1.00, 0.79],
        [0.01, 0.85, 0.11, 0.79, 1.00]
    ]).eigen(1e-8);

    let expected = [2.85309, 1.80633, 0.20449, 0.10241, 0.03368];
    let test = new $$.matrix([eigen.values])
        .transpose()
        .round(5)
        .data
        .every((v,ix) => v == expected[ix]);
    if(!test) 
        throw 'Eigenvales for 5x5 decimal matrix did not come out as expected.'

    runEigen('standard a', 1e-8, [
        [ 3,  2, -1],
        [ 3,  6, -1],
        [-2, -2,  2]
    ]);

    runEigen('Bigger Matrix', 1e-8, [
        [2,0,2,0,2],
        [0,3,0,3,0],
        [2,0,2,0,2],
        [0,3,0,3,0],
        [2,0,2,0,2]
    ]);
    
    runEigen('multiplicity a', 1e-8, [
        [1, -3, 3],
        [3, -5, 3],
        [6, -6, 4]
    ]);

    runEigen('multiplicity b', 1e-8, [
        [-5, -6, -3],
        [ 3,  4, -3],
        [ 0,  0, -2]
    ]);

    runEigen('multiplicity c', 1e-8, [
        [3, 1, 1],
        [0, 3, 2],
        [0, 0, 1]
    ]);

    runEigen('multiplicity d', 1e-8, [
        [ 3, -1,  2],
        [ 3, -1,  6],
        [-2,  2, -2]
    ]);

    runEigen('multiplicity e', 1e-8, [
        [ 4, -3,  9], 
        [ 8, -6, 12], 
        [-2,  1, -5]
    ]);    

    // Very pathological.  Complex eigenvectors.  Online it
    // gives the complex output.  R gives real number outputs,
    // but all have + or - 0i.  So real but sort of a warning
    // that it's complex involved.  Anyways, my iteration 
    // matches that of R.  To do it though, it requires a 
    // testing at random iterations.  See source code for
    // more info in matrix._eigen_getVector.
    runEigen('All Complex EigenVectors', 
        { 
            loopMax: 2000,
            threshold: 1e-6,
            valueMerge: 1e-2,
            testThreshold: 1e-5
        }, 
        [
            [ 0,   5, -6], 
            [-6, -11,  9], 
            [-4,  -6,  4]
        ]
    );

    return true;

}

function runEigen (title, params, data) {

    let m = new $$.matrix(data);

    try {
        let result = m.clone().eigen(params);
    } 
    catch (e) {
        throw `eigen() failed for '${title}'.  See console for more details.  ` + 
            (e || ''); 
    }

}

