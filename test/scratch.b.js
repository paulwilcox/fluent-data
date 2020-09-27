import * as g from '../src/general.js';



async function test () {

/*
    let F = g.getInverse(
        (input) => g.Fcdf(input, 5, 10),
        0.05,
        1e-12, // precision to desired output
        10000,
        0,
        5,
        0,
        null
    )
*/

    let iib = g.getInverse(
        (input) => g.incBeta(input, 5000, 0.5),
        0.025066909411210896955,
        1e-12,
        1000000,
        0,
        1
    )

    console.log({
        //F, 
        iib
    });

    return;


    //let data = await sample('orders');

    let data = [
        { cases: 7, distance: 560, time: 16.68 },
        { cases: 3, distance: 220, time: 11.50 },
        { cases: 3, distance: 340, time: 12.03 },
        { cases: 4, distance: 80, time: 14.88 },
        { cases: 6, distance: 150, time: 13.75 },
        { cases: 7, distance: 330, time: 18.11 }
    ];

    let results = 
        $$(data)
        .reduce({
            model: $$.regress('cases, distance', 'time', {ci: 0.95}),
            std: $$.std(row => row.cases, true)
        })
        .get();

    console.log(results.model)

    return true;


}

