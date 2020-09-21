import * as g from '../src/general.js';


function hyperGeo (a,b,c,z) {

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

    let factLogged = (num) => {
        let prod = Math.log(num);
        for (let i = num - 1; i >= 1; i--)
            prod += Math.log(i);
        return prod;
    }

    let sum = 1;

    for(let n = 1; n <= 1000; n++) {

        let zn = Math.log(Math.pow(z,n));
        if (zn == 0)
            zn = 1e-10;

        let add = ( (pochLogged(a,n) + pochLogged(b,n)) - pochLogged(c,n) ) 
                + (zn - factLogged(n));

        add = Math.pow(Math.E, add);

        if (!isFinite(add)) 
            throw `The next value to add is not finite (sum til now: ${sum})`

        sum += add;

        if(Math.abs(add) <= 1e-10)
            return sum;

    }

    throw `Couldn't get within in in 1e-10 (sum: ${sum})`;

}

async function test () {

    // dlmf.nist.gov/8.17#SS5.p1
    // aip.scitation.org/doi/pdf/10.1063/1.4822777

    /*
    let x = 0.99943427471;
    let a = 5000;
    let b = 0.5;
    */

    // Ah, x must be less than 0.5 to transform (mathworld.wolfram.com/PfaffTransformation.html)
    
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

    let factLogged = (num) => {
        let prod = Math.log(num);
        for (let i = num - 1; i >= 1; i--)
            prod += Math.log(i);
        return prod;
    }

    // Well, it doesn't seem to be any of the component terms that is causing non-finite
    // results.  
    let pl = pochLogged(100000,1000);
    let fl = factLogged(100000);

    console.log({pl, fl});

    return;

    let i = 0;
    let max = 1000;
    let step = (val) => {
        let tests = [
            0.5,1,5,10,50,100,500,
            1000,5000,10000,50000,100000
        ]
        return tests.filter(t => t > val)[0];
    }
    for (let a = step(0); a <= max; a = step(a))
    for (let b = step(0); b <= max; b = step(b))
    for (let c = step(0); c <= max; c = step(c))
    for (let z = 0.25; z < 1; z = z + 0.25) {
        i++;
        let h;
        try { 
            console.log({i,a,b,c,z,h:hyperGeo(a,b,c,z)})
        }
        catch(err) { 
            console.log({e:i,a,b,c,z,h:err})
        }
        if (i >= 500)
            return;
    }
    

    //console.log(hyperGeoLog(2, 3, 4, 0.5))
    

    
return;

    console.log({gamma: g.gamma(7.33)})
    console.log({iBeta: g.iBeta(0.99943427471, 5000, 0.5)})


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

