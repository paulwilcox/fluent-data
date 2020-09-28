import * as g from '../src/general.js';



async function test () {
    
    // dlmf.nist.gov/8.11#ii (way better than continued fraction)

    let a = 25;
    let z = 0.5;

    let pochLogged = (q, n) => {
        if (n == 0)
            return 1;
        let prod = Math.log(q);
        for (let i = 1; i < n; i++) 
            prod += Math.log(q + i);
        if (prod == 0) 
            prod = 1e-10;
        return prod;
    }

    let sum = 0;
    for (let k = 0; k <= 1000; k++) {
        let numerator = Math.pow(z,k);
        let denominator = Math.pow(Math.E, pochLogged(a, k+1));
        sum += numerator / denominator;
    }

    let result = Math.pow(z,a) * Math.pow(Math.E, -z) * sum;

    console.log({
        old: g.incGamma(a, z, 1e-20, 10000000, true),
        new: g.gamma(a) - result
    });


/*

    let F = g.getInverse(
        (input) => g.Fcdf(input, 5, 10),
        0.05,
        1e-12, // precision to desired output
        1000,
        0,
        5,
        0,
        null
    )

    console.log({F})

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

*/
}

