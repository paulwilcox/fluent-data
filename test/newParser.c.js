import parser from '../src/parser.js';
import hashBuckets from '../src/hashBuckets.js';

/*

    .merge((p,m) => p.id == m.id, 'left left')

    .merge(
        p => p.id, -- hash part
        (p,m) => p.hdGrad < p.colGrad, -- loop part
        'left left' -- strategy
    )

*/

function test () {

    let parsed = parser.pairEqualitiesToObjectSelectors((x,y) => x == y);
    
    let buckets = new hashBuckets(x => x, false)
        .addItems([{a: 'eigh', b: 'bee'}, {a: 'eigh', b: 'bee'}]);

    console.log(buckets);

    return true;
    
    let lambdas = [
        (x,y) => x.a == y.a && x.b == y.b,
        (x,y) => x.b >= y.a && x.b <= y.c,
        (x,y) => x.a == y.a || x.a == y.b,
        (x,y) => x.a == y.a || (x.a == y.c && y.c > y.b),
        (x,y) => x.a == y.a || y.b > 0
    ];

    /*

        - If there are any || at the top level, loop join only
        - Any parentheses are not part of the hash part
        - ==, ===, >=, and <= are okay for hash part
        - Any comparison not between left and right not part of the hash part

    */

    for(let lambdaIx in lambdas) {
        let funcs = objCreate(lambdas[lambdaIx]) || {};
        console.log(`%c--------------------------------------`, 'color: red');
        console.log(`\n%clambda: %c${lambdas[lambdaIx]}`, 'color: orange', 'color: red');
        console.log(`\n%cleft: %c${funcs.leftFunc}`, 'color: orange', '');
        console.log(`\n%cright: %c${funcs.rightFunc}`, 'color: orange', '');
    }

}

function objCreate (func) {

    let parsed = new parser(func);
    let [leftParam, rightParam] = parsed.parameters;
    let leftEqualities = [];
    let rightEqualities = [];
    let splitBodyByAnds = parsed.body.split(/&&|&/);

    for (let aix in splitBodyByAnds) {

        let andPart = splitBodyByAnds[aix];
        let eqParts = andPart.split(/===|==|=/);
        let leftEq;
        let rightEq;

        if (eqParts.length != 2)
            return;

        for (let eix in eqParts) {

            let ep = eqParts[eix].trim();

            if (/[^A-Za-z0-9_. ]/.test(ep)) 
                return;

            if (ep.startsWith(`${leftParam}.`))
                leftEq = ep;
            else if (ep.startsWith(`${rightParam}.`))
                rightEq = ep;
            else
                return; 

        }	    

        leftEqualities[aix] = `x${aix}: ${leftEq}`;
        rightEqualities[aix] = `x${aix}: ${rightEq}`;

    }

    return {
        leftFunc: new Function(leftParam, `return { ${leftEqualities.join(', ')} };`),
        rightFunc: new Function(rightParam, `return { ${rightEqualities.join(', ')} };`)
    };

}