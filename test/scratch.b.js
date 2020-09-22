import * as g from '../src/general.js';

class hyperGeo {
    
    constructor(
        iterations = 1000, 
        precision = 1e-10
    ) {
        this.iterations = iterations;
        this.precision = precision;
    }

    execute (a,b,c,z) {

        let sum = 1;
        let add;

        for(let n = 1; n <= this.iterations; n++) {

            let zn = Math.log(Math.pow(z,n));
            if (zn == 0)
                zn = 1e-10;

            add = ( (this.pochLogged(a,n) + this.pochLogged(b,n)) - this.pochLogged(c,n) ) 
                    + (zn - this.factLogged(n));

            add = Math.pow(Math.E, add);

            if (!isFinite(add)) 
                throw `The next value to add is not finite (sum til now: ${sum}, adder: ${add})`

            sum += add;

            if(Math.abs(add) <= this.precision)
                return sum;

        }

        throw `Couldn't get within in ${this.precision} (sum: ${sum}, adder: ${add})`;

    }

    incBeta(x,a,b) {
        return (Math.pow(x,a) / a) * this.execute(a, 1-b, a + 1, x);
    }

    incBeta2(z,a,b) {

        let sum = 0;
        let add;

        for (let n = 1; n <= this.iterations; n++) {
            
            add = Math.pow(Math.E, this.pochLogged(1-b,n)) 
                / (Math.pow(Math.E, this.factLogged(n)) * (a+n))

            add = Math.pow(z,n) * add;

            if (!isFinite(add)) 
                throw `The next value to add is not finite ` + 
                      `(val til now: ${Math.pow(z,a) * sum}, adder: ${add})`

            sum += add;

            if (n <= this.precision)
                return Math.pow(z,a) * sum;

        }

        throw `Couldn't get within in ${this.precision} (sum: ${Math.pow(z,a) * sum}, adder: ${add})`;

    }


    pochLogged(q, n) {
        if (n == 0)
            return 1;
        let prod = Math.log(q);
        for (let i = 1; i < n; i++) 
            prod += Math.log(q + i);
        if (prod == 0) 
            prod = 1e-10;
        return prod;
    }

    factLogged(num) {
        let prod = Math.log(num);
        for (let i = num - 1; i >= 1; i--)
            prod += Math.log(i);
        return prod;
    }


}

async function test () {

    // dlmf.nist.gov/8.17#SS5.p1
    // aip.scitation.org/doi/pdf/10.1063/1.4822777
    
    // Okay, finally, at least I've got a working and accurate implementation.  
    // 1 million iterations, which is ludicrus.  But it still processes quickly.  
    // Now I can give second shot at Lentz's algorithm.
    
    let x = 0.9999999999//0.99943427471;
    let a = 5000;
    let b = 0.5;
    
    let d2m = (m) => {
        m = m/2;
        return (m*x*(b-m)) / ((a+2*m-1) * (a+2*m))
    };
    let d2mp1 = (m) => {
        m = m - 1; m = m/2;
        return - ((a+m)*(a+b+m)*x) / ((a+2*m)*(a+2*m+1))
    }

    // how does this even work when x = 1?
    let multiplier = (Math.pow(x,a)*Math.pow(1-x,b)) / (a*0.02506690941121089696);
    
    let result = 1;

    for (let i = 1000000; i >= 1; i--) {
        let dFunc = i % 2 == 0 ? d2m : d2mp1;
        let dVal = dFunc(i);
        result = 1 + dVal / result; 
    }

    result = 1 / result;
    result = multiplier * result;

    console.log(result);

}    


/*
    console.log({gamma: g.gamma(7.33)})
    console.log({iBeta: g.iBeta(0.99943427471, 5000, 0.5)})


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



