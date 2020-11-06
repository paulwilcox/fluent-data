
async function test () {

    // stattrek.com/matrix-algebra/covariance-matrix.aspx

    let data = [
        { cases: 7, distance: 560, time: 16.68 },
        { cases: 3, distance: 220, time: 11.50 },
        { cases: 3, distance: 340, time: 12.03 },
        { cases: 4, distance: 80, time: 14.88 },
        { cases: 6, distance: 150, time: 13.75 },
        { cases: 7, distance: 330, time: 18.11 }
    ];

    data = [
        { math: 90, english: 60, art: 90 }, 
        { math: 90, english: 90, art: 30 }, 
        { math: 60, english: 60, art: 60 }, 
        { math: 60, english: 60, art: 90 }, 
        { math: 30, english: 30, art: 30 }
    ]

    let asMatrix = 
        $$(data)
        .matrix('math, english, art')
        .get();

    let result = // result is averages
        $$.matrix.ones(asMatrix.data.length)
        .multiply(asMatrix)
        .multiply(1/asMatrix.data.length); 

    result = asMatrix.clone().apply(result, (a,b) => a - b); // result is deviations
    result = result.clone().transpose().multiply(result); // result is squared deviations
    let cov = result.multiply(1/asMatrix.data.length);

    // math.stackexchange.com/questions/186959/correlation-matrix-from-covariance-matrix/300775
    let D = $$(cov.diagonal()).matrix(x => [x]).apply(x => Math.pow(x,0.5));
    console.log(result);

    return true;


}

