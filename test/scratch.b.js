async function test () {


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


    let correlations = new $$.matrix([
        [1.00, 0.02, 0.96, 0.42, 0.01],
        [0.02, 1.00, 0.13, 0.71, 0.85],
        [0.96, 0.13, 1.00, 0.50, 0.11],
        [0.42, 0.71, 0.50, 1.00, 0.79],
        [0.01, 0.85, 0.11, 0.79, 1.00]
    ])
    .setRowNames('r1,r2,r3,r4,r5')
    .setColNames('c1,c2,c3,c4,c5');      

    let results = eigenPower(correlations.clone());
    results.rCompare = results.vector.map(v => v * (0.3314539 / results.vector[0]))
    console.log(results);

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