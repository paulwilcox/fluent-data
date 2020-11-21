async function test () {

    let correlations = new $$.matrix([
        [1.00, 0.02, 0.96, 0.42, 0.01],
        [0.02, 1.00, 0.13, 0.71, 0.85],
        [0.96, 0.13, 1.00, 0.50, 0.11],
        [0.42, 0.71, 0.50, 1.00, 0.79],
        [0.01, 0.85, 0.11, 0.79, 1.00]
    ]);      

    let result = correlations.clone().decompose('qr').focusData;

    console.log(result)

    let maxIterations = 1000;
    let errorThreshold = 1e-8;
    let T = correlations.clone();
    let U = $$.matrix.identity(correlations.data.length);

    let iter = 0;
    for (let i = 1; i <= maxIterations; i++) {
        iter++;
        let QR = T.clone().decompose('qr');
        T = QR.R.multiply(QR.Q);
        U = U.multiply(QR.Q);
        if (T.isUpperTriangular(errorThreshold))
            break;
    }

    console.log({
        iter,
        T: T.round(8).data,
        U: U.round(8).data,
        test: correlations.clone().multiply(U.get(null, 1)).data,
        test2: U.clone().get(null,0).multiply(T.data[1][1]).data 
    })

    return true;

}

/*

    Expected, via R
        
    eigen() decomposition
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