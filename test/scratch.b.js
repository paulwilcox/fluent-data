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
            corMatrixT: $$.corMatrix2('cases, distance, time', true),
            corMatrixF: $$.corMatrix2('cases, distance, time', false),
        })
        .get();

    console.log({
        corMatrixT: result.corMatrixT.data,
        corMatrixF: result.corMatrixF.data,
    });


    return true;

}

