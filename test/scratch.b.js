import * as g from '../src/general.js';



async function test () {

    // Getting Student's T critical value from probability 
    // homepages.ucl.ac.uk/~ucahwts/lgsnotes/JCF_Student.pdf
    // boost.org/doc/libs/1_58_0/libs/math/doc/html/math_toolkit/dist_ref/dists/students_t_dist.html

    let u = 0.95;
    let n = 10000;

    let sign = Math.sign(u - 0.5);
    let ib = 0.9997294687270260303929;

    let inner = n * (1/ib - 1);
    let result = sign * Math.pow(inner, 0.5);


console.log({
    bgoal: 0.02506690941121089696,
    bactual: g.beta(5000, 0.5)
})

console.log({
    ibgoal: 0.001773913287682948881835,
    ibactual: g.incBeta(0.9990234375, 5000, 0.5)
})

return;

    console.log('ib analysis', {
        x: 0.1,
        a: 5000,
        b: 0.5,
        actual: g.invRegBeta(
            0.5, 
            5000, 
            0.5,
            1e-14,
            1000000
        ),
        goal: 0.9997294687270260303929
    })

    console.log(result);

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
            model: $$.regress('cases, distance', 'time'),
            std: $$.std(row => row.cases, true)
        })
        .get();

    console.log(results.model)

    return true;


}

