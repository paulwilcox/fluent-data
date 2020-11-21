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

    let eigen = correlations.clone().eigen();

    console.log(eigen);

    return true;

}
