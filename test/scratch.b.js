async function test () {

/*
    let correlations = new $$.matrix([
        [1.00, 0.02, 0.96, 0.42, 0.01],
        [0.02, 1.00, 0.13, 0.71, 0.85],
        [0.96, 0.13, 1.00, 0.50, 0.11],
        [0.42, 0.71, 0.50, 1.00, 0.79],
        [0.01, 0.85, 0.11, 0.79, 1.00]
    ]);

    let values = correlations._eigen_qr().values.map(x => x[0]);

    // www.math.iit.edu/~fass/477577_Chapter_14.pdf
    // en.wikipedia.org/wiki/Arnoldi_iteration

    let A = correlations.clone();
    let threshold = 1e-6;
    let maxIterations = 58;

    let q = [new $$.matrix(values.map(x => [1]))];

    let h = new $$.matrix([]);

    for (let k = 1; k < maxIterations; k++) {

        console.log(k);

        q[k] = A.clone().multiply(q[k-1]);

        for (let j = 0; j <= k; j++) {

            if(h.data[j] == undefined) 
                h.data.push([]); 

            while(h.data[j][k-1] == undefined)
                h.data[j].push(0);

            if (j == k)
                continue;

            // makes a scalar
            h.data[j][k-1] = q[j].clone().transpose().multiply(q[k]).data[0][0];

            q[k].subtract(q[j].clone().multiply(h.data[j][k-1]));

        }

        h.data[k][k-1] = q[k].norm();

        q[k].multiply(1 / h.data[k][k-1]);

    }

    $$.matrix.logMany(
        {
            A, 
            qFirst: q[0], 
            qSecLast: q[q.length - 2], 
            qLast: q[q.length - 1], 
            h
        },
        'arnoldi',
        6
    );

*/

    let A = new $$.matrix([
        [1, -3, 3],
        [3, -5, 3],
        [6, -6, 4]
    ]);

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

    //console.log(A.eigen(1e-6))

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