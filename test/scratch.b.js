async function test () {

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

    let A = upperHessenderize(correlations.clone()).round(10);
    A.log();

    /*
    let result = correlations.clone().decompose('qr');
    result.test = result.test();
    $$.matrix.logMany(result, 'qr-decomposition');
    */

    let eigen = correlations.clone().eigen();
    $$.matrix.logMany(eigen, 'Cor eigens', 8);

    eigen = A.clone().eigen(1e-10, 100);
    $$.matrix.logMany(eigen, 'A eigens', 8);


    return true;

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