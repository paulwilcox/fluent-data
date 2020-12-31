async function test () {



    // www-users.cs.umn.edu/~saad/eig_book_2ndEd.pdf (p89).
    // Inverse gets lowest vector, but misses value (i think as expected).
    // The shift need to essentially be a middle eigenvector, but it cannot
    // be too close to it, and must be below it (if positive, unknown if negative).

    let correlations = new $$.matrix([
        [1.00, 0.02, 0.96, 0.42, 0.01],
        [0.02, 1.00, 0.13, 0.71, 0.85],
        [0.96, 0.13, 1.00, 0.50, 0.11],
        [0.42, 0.71, 0.50, 1.00, 0.79],
        [0.01, 0.85, 0.11, 0.79, 1.00]
    ])
    .setRowNames('r1,r2,r3,r4,r5')
    .setColNames('c1,c2,c3,c4,c5');      

    let A = correlations.clone();
/*
    let results = eigenPower(A.clone());
    results.rCompare = results.vector.map(v => v * (0.3314539 / results.vector[0]))
    console.log(results);
*/
    // let results2 = A.clone().inverse(); 
    let results2 = $$.matrix.identity(A.data.length).multiply(1.80633245);
    results2 = A.clone().subtract(results2);
    results2 = results2.pseudoInverse();
    results2 = eigenPower(results2);
    console.log(results2);

    /*

        $values
        [1] 2.85309042 1.80633245 0.20449022 0.10240947 0.03367744

        $vectors
                [,1]        [,2]        [,3]       [,4]         [,5]
        [1,] 0.3314539 -0.60721643  0.09848524  0.1386643  0.701783012
        [2,] 0.4601593  0.39003172  0.74256408 -0.2821170  0.071674637
        [3,] 0.3820572 -0.55650828  0.16840896  0.1170037 -0.708716714
        [4,] 0.5559769  0.07806457 -0.60158211 -0.5682357  0.001656352
        [5,] 0.4725608  0.40418799 -0.22053713  0.7513990  0.009012569

    */

/*
    let m = new $$.matrix([
        [1, -3, 3],
        [3, -5, 3],
        [6, -6, 4]
    ]);

    let eigenvalues = [4,2,2];

    try {
        $$.matrix.logMany(m.eigen(), 'eigen', 8)
    } catch {}
    
    $$.matrix.logMany(m.eigen2(), 'eigen2', 8)
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

// citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.149.4934&rep=rep1&type=pdf
function eigenPower (
    A,
    threshold = 1e-12,
    maxIterations = 1000
) {

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
            ...prev.map((p,ix) => Math.abs(p - vector[ix]))
        );

console.log({iterations, value, vector, A: A.data})

        if (maxDiff < threshold) 
            return {
                iterations,
                value,
                vector
            };        
            
        if (iterations > maxIterations)
            throw `eigenPower could not converge even after ${iterations} iterations.`;

        prev = vector.map(x => x);

    }

}

