async function test () {

/*
    let correlations = new $$.matrix([
        [1.00, 0.02, 0.96, 0.42, 0.01],
        [0.02, 1.00, 0.13, 0.71, 0.85],
        [0.96, 0.13, 1.00, 0.50, 0.11],
        [0.42, 0.71, 0.50, 1.00, 0.79],
        [0.01, 0.85, 0.11, 0.79, 1.00]
    ]);

*/

// TODO: Separate threshold parameter into ones for value threshold,
// vector threshold, multiplicity threshold, and test threshold. 

    runEigenDups([
        [1, -3, 3],
        [3, -5, 3],
        [6, -6, 4]
    ]);

    runEigenDups([
        [-5, -6, -3],
        [ 3,  4, -3],
        [ 0,  0, -2]
    ]);

    runEigenDups([
        [3, 1, 1],
        [0, 3, 2],
        [0, 0, 1]
    ]);

    runEigenDups([
        [ 3, -1,  2],
        [ 3, -1,  6],
        [-2,  2, -2]
    ]);

    runEigenDups([
        [ 3,  2, -1],
        [ 3,  6, -1],
        [-2, -2,  2]
    ]);

    // Very pathological.  Complex eigenvectors.  Online it
    // gives the complex output.  R gives real number outputs,
    // but all have + or - 0i.  So real but sort of a warning
    // that it's complex involved.  ANyways, my iteration 
    // matches that of R.  To do it though, it requires a 
    // testing at random iterations.  See source code for
    // more info in matrix._eigen_getVector.
    runEigenDups([
        [ 0,   5, -6], 
        [-6, -11,  9], 
        [-4,  -6,  4]
    ]);
     
    runEigenDups([
        [ 4, -3,  9], 
        [ 8, -6, 12], 
        [-2,  1, -5]
    ]);    

    runEigenDups([
        [2,0,2,0,2],
        [0,3,0,3,0],
        [2,0,2,0,2],
        [0,3,0,3,0],
        [2,0,2,0,2]
    ])
    
    console.log('done')

}

function runEigenDups (data) {

    let m = new $$.matrix(data);

    try {
        let eigen = m.clone().eigen(1e-8, 1000, 6);
        let result = {
            original: m,
            values: eigen.values
        }
        $$.matrix.logMany(result, 'Actually Passed')
    } catch (e) {
        $$.matrix.logMany(e, 'Error');
        console.log({e})
    }

}

