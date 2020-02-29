import parser from '../src/parser.js';

/*

    .merge((p,m) => p.id == m.id, 'left left')

    .merge(
        p => p.id, -- hash part
        (p,m) => p.hdGrad < p.colGrad, -- loop part
        'left left' -- strategy
    )

*/

function test () {

    let lambdas = [
        (x,y) => x.a == y.a && x.b == y.b,
        (x,y) => x.b >= y.a && x.b <= y.c,
        (x,y) => x.a == y.a || x.a == y.b,
        (x,y) => x.a == y.a || (x.a == y.c && y.c > y.b),
        (x,y) => x.a == y.a || y.b > 0
    ];

    let expected = [
        {
            original: (x,y) => x.a == y.a && x.b == y.b,
            leftExpect: x => ({x0: x.a, x1: x.b}),
            rightExpect: y => ({x0: y.a, y0: y.b}),
        },
        {
            original: x.a == y.a || x.a == y.b,
            leftExpect: x => [{x0: x.a}, {x0: x.a}],
            rightExpect: y => [{x0: y.a}, {x0: y.b}],
            loopExpect: (x,y,matchResults) => matchResults[0] || matchResults[1]
        }
    ]

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