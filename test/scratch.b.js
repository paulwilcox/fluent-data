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

    // Wow!  My output is -7.684659, 4.684659, 0.
    // R output is 3, 0, 0
    // I plug it into a website matrix calculator and (after computing the lambdas expressed)
    // as polynomials, it comes out with MY output, not R's output!
    // The website is www.emathhelp.net/calculators/linear-algebra/eigenvalue-and-eigenvector-calculator

    // Nevermind.  I plugged it in wrong in R.  It now matches.

    let m = new $$.matrix([
        [-5, -6, -3],
        [ 3,  4, -3],
        [ 0,  0, -2]
    ]);

    $$.matrix.logMany(
        m.eigen(1e-6, 1000, 6),
        'eigen',
        10
    );

    console.log({test})

/*
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

}

function runEigenDups (data) {

    let m = new $$.matrix(data);

    try {
        let eigen = m.clone().eigen(1e-12, 1000, 6);
        let result = {
            original: m,
            values: eigen.values
        }
        $$.matrix.logMany(result, 'Actually Passed')
    } catch (e) {
        $$.matrix.logMany(e, 'Error');
    }

}


// citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.149.4934&rep=rep1&type=pdf
function _eigen_getVect (
    A,
    eigenvalue,
    threshold = 1e-12,
    maxIterations = 1000
) {

    let n = A.data.length;
    let ei = $$.matrix.identity(n).multiply(eigenvalue);

    console.log({
        A: A.data,
        n,
        ei: ei.data,
        test1: A.clone().subtract(ei).data,
        test2: A.clone().subtract(ei).pseudoInverse().data 
    })
    return;

    A = A.clone().subtract(ei).pseudoInverse();

    let value = null;
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

        let result = {
            iterations, 
            eigenvalue,
            valueAfterShift: value,
            vector
        };

if (isNaN(value)) { 
    console.log({ result, prev });
    throw 'eigen value after shift is NAN';
}

        if (maxDiff < threshold) 
            return result;        
            
        if (iterations > maxIterations) {
            let message = 
                `getVect could not converge even after ${iterations} iterations.  ` +
                `You may have to increase the 'maxIterations' or 'threshold' parameters.  ` +
                `Most likey the latter.  This is especially true if you have repeated ` +
                `eigenvalues. `;
            console.log(message);
            throw {
                message,
                failingObjects: result
            }
        }

        prev = vector.map(x => x);

    }

}