async function test () {

    let matrix = new $$.matrix([
        [-5, -6, -3],
        [ 3,  4, -3],
        [ 0,  0, -2]
    ]);


    //let eigen = matrix.clone().eigen();
    //$$.matrix.logMany(eigen, 'Regular eigens', 8);

    let A = upperHessenderize(matrix.clone());
    //A.log();
    //let eigen = 
        A.clone().eigen2();
    //$$.matrix.logMany(eigen, 'A eigens', 8);

return;

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


// Of course I'll find a different name
function upperHessenderize (A) {

    for (let level = 0; level < A.data.length - 2; level++) {

        let L1L0 = A.data[level+1][level];

        let alpha = // sum of squares of A[level+i:n, level]
            A.clone() 
            .get((row,ix) => ix > level, level)
            .apply(x => Math.pow(x,2))
            .transpose()
            .data[0]
            .reduce((a,b) => a+b);
        alpha = Math.pow(alpha,0.5);
        alpha = -Math.sign(L1L0) * alpha; 

        let r = Math.pow(alpha,2) - L1L0 * alpha;
        r = Math.pow(r / 2, 0.5);

        let v = new $$.matrix([...Array(A.data.length).keys()].map(ix => [
              ix <= level ? 0
            : ix == (level + 1) ? (L1L0 - alpha) / (2*r) 
            : A.data[ix][level] / (2*r)
        ]));
        let vv = v.clone().multiply(v.clone().transpose());

        let P = $$.matrix.identity(v.data.length)
            .subtract(vv.multiply(2));

        A = P.clone().multiply(A.multiply(P));

    }

    return A;

}


function givens (a,b) {

    let cos,sin;

    if (b == 0) 
        cos = sin = 0; 
    else if (Math.abs(b) >= Math.abs(a)) {
        let x = a/b;
        sin = 1/Math.pow(1+Math.pow(x,2),0.5);
        cos = sin*x;
    }
    else {
        let x = b/a;
        cos = 1/Math.pow(1+Math.pow(x,2),0.5);
        sin = cos*x;         
    }

    return { cos, sin };

}