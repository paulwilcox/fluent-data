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


    let A = new $$.matrix([
        [1, -3, 3],
        [3, -5, 3],
        [6, -6, 4]
    ]);
/*
    let val = -2.00001; 
    let n = A.data.length;
    let m = $$.matrix.identity(n).multiply(val);
    m = A.clone().subtract(m).pseudoInverse();

    let vect = getVect(m, 1e-6, 1000);
    vect = new $$.matrix(vect.vector.map(x => [x]));

    let AV = A.clone().multiply(vect);
    let VV = vect.multiply(val);
    let test = AV.equals(VV, 1e-6, true);

    $$.matrix.logMany({ val, vect, AV, VV, test }, 'stuff', 10)
  */  
    $$.matrix.logMany(_eigen_qr(A, 1e-12, 10005), 'eigen_qr', 8);

/*
    let m = new $$.matrix([
        [1, -3, 3],
        [3, -5, 3],
        [6, -6, 4]
    ]);

    // eigenvalues = 4, -2, -2;

    $$.matrix.logMany(m._eigen_qr(), 'eigen_qr', 8);
    $$.matrix.logMany(m.eigen(1e-6, 1000), 'eigen', 8);
*/

/*
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
*/

/*

    let correlations = new $$.matrix([
        [1.00, 0.02, 0.96, 0.42, 0.01],
        [0.02, 1.00, 0.13, 0.71, 0.85],
        [0.96, 0.13, 1.00, 0.50, 0.11],
        [0.42, 0.71, 0.50, 1.00, 0.79],
        [0.01, 0.85, 0.11, 0.79, 1.00]
    ])
    .setRowNames('r1,r2,r3,r4,r5')
    .setColNames('c1,c2,c3,c4,c5');      

    // Among others: pages.mtu.edu/~struther/Courses/OLD/Other/Sp2012/5627/BlockQR/Work/MA5629%20presentation.pdf
    // But it seems VERY similar to parts inside qr decomposition.  
    // Is the algorithm I used already doing this?
    // I suppose I can feed this into it and see if it results in fewer iterations and the same eigens.

    let A = upperHessenderize(correlations.clone());
    A.log();

    eigen = correlations.clone().eigen();
    $$.matrix.logMany(eigen, 'Cor eigens', 8);

    eigen = A.clone().eigen();
    $$.matrix.logMany(eigen, 'A eigens', 8);


    return true;
*/

}

function runEigenDups (data) {

    let m = new $$.matrix(data);

    try {
        let eigen = m.clone().eigen(1e-6, 2000);
        $$.matrix.logMany(eigen, 'Actually Passed')
    } catch{}

}

function getVect (
    A,
    threshold = 1e-12,
    maxIterations = 1000
) {

    A = A.clone();
    let value;
    let vector = A.data.map(row => 1);
    let prev = A.data.map(row => 1);

    let iterations = 0;
    while(iterations++ <= maxIterations) {
        
        let y = A.data.map(row => 
            row
            .map((cell,ix) => cell * prev[ix])
            .reduce((a,b) => a + b)
        );

        // I originally tried this with 'value = Math.min(...y)',
        // which is a p-1 norm.  And it works.  And I think any
        // norm will.  But I see most sources using p-2 norm.  
        // For real numbers, this is euclidean distance.  And 
        // it seems to shave off a few iterations.
        value = y.map(_ => Math.pow(_,2));
        value = value.reduce((a,b) => a + b);
        value = Math.pow(value,0.5);

        vector = y.map(_ => _ / value);

        let maxDiff = Math.max(
            ...prev.map((p,ix) => Math.abs(Math.abs(p) - Math.abs(vector[ix])))
        );

        let result = {iterations, value, vector};

        if (maxDiff < threshold) 
            return result;        
            
        if (iterations > maxIterations) {
            console.log('failing objects:');
            console.log(result);
            throw `eigenPower could not converge even after ${iterations} iterations.`;
        }

        prev = vector.map(x => x);

    }

}


function _eigen_qr(A, errorThreshold = 1e-8, maxIterations = 1000) {

    A = A.clone();
    let values = A.clone();
    //let vectors = matrix.identity(A.data.length);
    let prev;
    let diag;

    let iterations = 0;
    while (iterations++ <= maxIterations) {

        let QR = values.clone().decompose('qr');
        values = QR.R.multiply(QR.Q);
        diag = values.diagonal(true).transpose().data[0];
        //vectors = vectors.multiply(QR.Q);

        if (prev) {

            let test = true;

            // convergence with previous test
            for(let i = 0; i < diag.length; i++) 
                if (Math.abs(diag[i] - prev[i]) > errorThreshold) {
                    test = false;
                    break; 
                }

            // convergence of multiplicity > 1
            for(let a of diag)
            for(let b of diag) {
                let diff = Math.abs(a - b);
                if (diff < 1e-6 && diff > 1e-12) 
                    test = false;                
            }
  
            if (test)
                break; 

        }
        
        if (iterations == maxIterations) {
            $$.matrix.logMany({iterations, values, prev}, 'failing objects', 8);
            throw `Eigenvalues did not converge within ${maxIterations} iterations.`;
        }

        prev = diag;

    }
    
    return {
        iterations,
        A,
        values: diag,
        prev
    };

}
