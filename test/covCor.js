async function test () {

    let data = [
        { cases: 7, distance: 560, time: 16.68 },
        { cases: 3, distance: 220, time: 11.50 },
        { cases: 3, distance: 340, time: 12.03 },
        { cases: 4, distance: 80, time: 14.88 },
        { cases: 6, distance: 150, time: 13.75 },
        { cases: 7, distance: 330, time: 18.11 }
    ];

    let result = 
        $$(data)
        .reduce({
            covMatrix: $$.covMatrix('cases, distance, time'),
            corMatrix: $$.corMatrix('cases, distance, time'),
        })
        .get();

    let expectedCov = new $$.matrix([
        [   3.60,   146.00,   4.28],
        [ 146.00, 29000.00, 168.84],
        [   4.28,   168.84,   6.72]       
    ]);

    let expectedCor = new $$.matrix([
        [1.000, 0.452, 0.870],
        [0.452, 1.000, 0.383],
        [0.870, 0.383, 1.000]        
    ]);

    if(!result.covMatrix.round(2).equals(expectedCov))
        throw 'covMatrix does not match expected value in at least one cell.';

    if(!result.corMatrix.round(3).equals(expectedCor))
        throw 'corMatrix does not match expected value in at least one cell.';

    return true;

}
