async function test () {

/*

    let m = new $$.matrix([
        [-3, -3, 3],
        [ 3, -9, 3],
        [ 6, -6, 0]
    ]);


    let zeroes = new $$.matrix([[0],[0],[0]]);

    let result = m.clone().solve(zeroes, false, true);
    result.mDeterminat = m.determinant();
    $$.matrix.logMany(result, 'result')

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


    let example = new $$.matrix([
        [  8.0, 7.3, -5,   2],
        [  4.0, 8.4,  4, -36],
        [-43.5, 2.9, -3, -22],
        [ 84.2, 8.8, -7,  15],
        [-12.3, 6.5,  6,  14],
        [ 23.3, 4.5,  6,  -8],
        [ 32.8, 7.4, -1,  10]
    ])

    let X = example.clone();
    let L = $$.matrix.identity(X.data.length); 
    let D = $$.matrix.identity(X.data[0].length);
    let R = $$.matrix.identity(X.data[0].length, X.data[0].length);


    for (let i = 0; i <= 50; i++) {

        L = X.clone()
            .multiply(R.clone().transpose())
            .decompose('qr').Q
            .get(null,(col,ix) => ix >= 0 && ix <= X.data[0].length - 1);

        let qr = X.clone().transpose().multiply(L).decompose('qr');
        R = qr.Q.clone().get(null,(col,ix) => ix >= 0 && ix <= X.data[0].length - 1).transpose();
        D = qr.R.clone().transpose();

    }

    R = R.transpose();

    let I = new $$.matrix.identity(X.data[0].length);
    I.data[2][2] = -1;
    let Dv2 = D.clone().multiply(I);

    // TODO: Dv2 corrects D, but I think a similar correction should be needed in L or R or both.
    let result = { L, D, R, Dv2 }
    result.test = 
           result.L.clone().multiply(result.D).multiply(result.R.clone().transpose()).equals(X, 1e-8) 
        && L.clone().transpose().multiply(L).equals($$.matrix.identity(X.data[0].length), 1e-8)
        && R.clone().transpose().multiply(R).equals($$.matrix.identity(X.data[0].length), 1e-8);

    $$.matrix.logMany(result, 'result', 12)

/*

    // hal.archives-ouvertes.fr/hal-01927616/file/IEEE%20TNNLS.pdf

    let lambda = correlations.clone().transpose();
    let U = $$.matrix.identity(correlations.data.length);
    let V = $$.matrix.identity(correlations.data[0].length);

    for (let i = 0; i < 1000; i++) {

        let QR = lambda.clone().transpose().decompose('qr');
        U.multiply(QR.Q);
        
        QR = QR.R.transpose().decompose('qr');
        lambda = QR.R;
        V.multiply(QR.Q);

    }

    let result = { lambda, U, V, rebuilt: U.clone().multiply(lambda.clone()).multiply(V.clone().transpose()) };

    $$.matrix.logMany(result, 'result', 8)

*/

/*

    let e = correlations.eigen();
    let e2 = correlations.eigen2();

    $$.matrix.logMany(e, 'e', 8);
    $$.matrix.logMany(e2, 'e2', 8);
    
*/

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


