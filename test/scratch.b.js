import * as g from '../src/general.js';


async function test () {

    // dlmf.nist.gov/8.17#SS5.p1
    // aip.scitation.org/doi/pdf/10.1063/1.4822777

    let x = 0.99943427471;
    let a = 5000;
    let b = 0.5;

    let athTerm = (i) => {

        if (i % 2 == 0) {
            let num = i * (b - i) * x;
            let den = (a + 2*i - 1) * (a + 2*i);
            return num/den;
        }
        else {
            let num = (a + i) * (a + b + i) * x;
            let den = (a + 2*i) * (a + 2*i + 1);
            return -num/den;
        }

    }


    let iota = 0.000000000001;

    let strategy = (id, AratioStart, BratioStart, Fstart) => {

        let bthTerm = 1;
        let Aratio = AratioStart; 
        let Bratio = BratioStart; 
        let F = Fstart; 

        if (Aratio == 0) Aratio = iota;
        if (Bratio == 0) Bratio = iota;
        if (F == 0) F = iota;

        for (let i = 0; i <= 100; i++) {

            F = F * Aratio * Bratio;
            if (F == 0) F = iota;

            Aratio = bthTerm + athTerm(i) / Aratio;
            if (Aratio == 0) Aratio = iota;

            Bratio = 1 / (bthTerm + athTerm(i)*Bratio); 
            if (Bratio == 0) Bratio = iota;

        }

        let leadMulti = (Math.pow(x,a) * Math.pow(1 - x, b)) / (a * 0.02506690941121089696 /*g.iBeta(1, a, b)*/)

        console.log({['strategy' + id]: F * leadMulti})        

    }

    console.log({gamma: g.gamma(7.33)})
    console.log({iBeta: g.iBeta(0.99943427471, 5000, 0.5)})
    //console.log({iBeta2: F * leadMulti});

    // okay at least now we know the ratios really just adjust the magnitude
    strategy(1, 0, 0, 0);
    strategy(2, 0, 0, 1);
    strategy(3, 0, 1, 0);
    strategy(4, 0, 1, 1);
    strategy(5, 1, 0, 0);
    strategy(6, 1, 0, 1);
    strategy(7, 1, 1, 0);
    strategy(8, 1, 1, 1);

/*

    let b = g.iBeta(0.99943427471, 5000, 0.5);

    console.log({
        b,
        desired: 0.0004354190320508021051
    })


    let irb = g.invRegBeta(0.05, 5000, 0.5);
    let rb = g.regBeta(irb, 5000, 0.5);
    let ib = g.iBeta(irb, 5000, 0.5);

    console.log({
        a_irb: irb,
        b_rb: rb,
        c_ib: ib
    });
    
*/
    
    /*

    // Gamma references
        // link.springer.com/content/pdf/bbm%3A978-3-319-43561-9%2F1.pdf
        // my.fit.edu/~gabdo/gamma.txt
        // valelab4.ucsf.edu/svn/3rdpartypublic/boost/libs/math/doc/sf_and_dist/html/math_toolkit/backgrounders/lanczos.html


    // Getting Student's T critical value from probability 
    // homepages.ucl.ac.uk/~ucahwts/lgsnotes/JCF_Student.pdf
    // boost.org/doc/libs/1_58_0/libs/math/doc/html/math_toolkit/dist_ref/dists/students_t_dist.html

    let u = 0.95;
    let n = 10000;

    let sign = Math.sign(u - 0.5);
    let ib = g.invRegBeta(u < 0.5 ? 2 * u : 2 * (1-u), n/2, 0.5);
    let inner = n * (1/ib - 1);

    let result = sign * Math.pow(inner, 0.5);

    console.log({
        result,
        sign, 
        ib,
        inner
    });
    *?




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

    */

}

