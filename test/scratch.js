
//stat.rice.edu/~dobelman/textfiles/DistributionsHandbook.pdf (p66)
function iBeta (x, p, q) {
        
    // Convergence is better when p > q, so if that's not
    // the case, use this equivalence.    
    if(p < q) 
        return iBeta(1, q, p) - iBeta(1-x, q, p);

    let sum = 0;
    let t = 1/p;
    for(let r = 0; r <= 1000; r++) {

        if (r > 0)
            t *= (x * (r-q) * (p + r - 1)) 
            /  (r * (p + r));

        sum += t;

        if (Math.abs(t) <= 0.00000000000001)
            break;

    }

    return Math.pow(x,p) * sum;

}

function regBeta (x, p, q) {
    return iBeta(x, p, q) / iBeta(1, p, q);
}

function Fcdf (F, numDf, denDf) {
    let x = (F * numDf) / (denDf + (F * numDf));
    return 1 - regBeta(x, numDf/2, denDf/2);
}

let result = Fcdf(4.668, 2, 3);
console.log(result)
