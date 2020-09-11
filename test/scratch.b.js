import * as g from '../src/general.js';


async function test () {

    // dlmf.nist.gov/8.17#SS5.p1
    // aip.scitation.org/doi/pdf/10.1063/1.4822777

    let x = 0.99943427471;
    let a = 5000;
    let b = 0.5;

    // swapping even and odd implementatinos becasue
    // we want index of 1 to start at Lentz's a1 position,
    // whearas 8.17.22 has d1 starting at a2 
    let athTerm = (i) => {

        if (i == 1)
            return 1;
        else if (i % 2 == 0) {
            let num = (a + i) * (a + b + i) * x;
            let den = (a + 2*i) * (a + 2*i + 1);
            return -num/den;
        }
        else {
            let num = i * (b - i) * x;
            let den = (a + 2*i - 1) * (a + 2*i);
            return num/den;
        }

    }


    let AprevPrev = 1;
    let Aprev = 0; // there is no b0
    let BprevPrev = 0;
    let Bprev = 1;

    let Aratio = Aprev / AprevPrev;
    let Bratio = BprevPrev / Bprev;
    let bthTerm = 1;

    // TODO: What is Fn0?  Is it 0 or 
    // do I use A and B ratio rignt now?

    for (let i = 1; i <= 10; i++) {

        Aratio = bthTerm + athTerm(i) / Aratio;
        Bratio = 1 / (bthTerm + athTerm(i)*Bratio); 
    }


    console.log({
        gamma: g.gamma(7.33),
        iBeta: g.iBeta(0.99943427471, 5000, 0.5),
        iBeta2: ""
    });

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

