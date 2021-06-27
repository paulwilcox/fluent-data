import dataset from '../dataset.js';
import matrix from '../matrix.js';
import * as g from '../general.js';

export function first(rowFunc) { 
    return data => {
        for (let row of data)
            if (rowFunc(row) !== undefined && rowFunc(row) !== null)
                return rowFunc(row);
        return null;
    }
};

export function last (rowFunc) {
    return data => {
        let last = null;
        for (let row of data) {
            let val = rowFunc(row);
            if (val !== undefined && val !== null)
                last = val;
        }
        return last;
    }
}

export function sum(rowFunc) { 
    return data => {
        let agg = 0;
        for (let row of data) 
            agg += rowFunc(row);
        return agg;
    }
}

export function count(rowFunc) { 
    return data => {

        let agg = 0;
        for (let row of data) {
            let r = rowFunc(row)
            if (r !== undefined && r !== null)
                agg += 1;
        }
        return agg;
    }
}

export function avg(rowFunc) { 
    return data => {

        let s = sum(rowFunc)(data);
        let n = count(rowFunc)(data);
        return s / n;
    }
}

export function std(rowFunc, isSample = false) { 
    return data => {
        let m = avg(rowFunc)(data);
        let ssd = data.reduce((agg,row) => agg + Math.pow(rowFunc(row) - m,2), 0);
        let n = count(rowFunc)(data);
        if (isSample)
            n--;
        return Math.pow(ssd/n, 0.5);
    }
}

export function mad(rowFunc) { 
    return data => {

        let avg = this.avg(rowFunc)(data);
        let devs = [];

        for (let ix in data)
            devs[ix] = Math.abs(rowFunc(data[ix]) - avg);
    
        return this.avg(x => x)(devs);    

    }
}

export function cor(rowFunc, options) {
    return data => {
    
        let xAvg = avg(v => rowFunc(v)[0])(data);
        let yAvg = avg(v => rowFunc(v)[1])(data);
        let n = count(v => rowFunc(v))(data);

        let diffs = [];
        for(let row of data) 
            diffs.push({ 
                xDiff: rowFunc(row)[0] - xAvg, 
                yDiff: rowFunc(row)[1] - yAvg
            });

        let xyDiff = sum(row => row.xDiff * row.yDiff)(diffs);
        let xDiffSq = sum(row => row.xDiff ** 2)(diffs);
        let yDiffSq = sum(row => row.yDiff ** 2)(diffs);

        let cor = xyDiff / (xDiffSq ** 0.5 * yDiffSq ** 0.5)
        let df = n - 2;
        let t =  g.studentsTfromCor(cor, n);
        let pVal = g.studentsTcdf(t, df);
            
        if (options === undefined)
            return cor;

        if (options.tails == 2)
            pVal *= 2;

        return { cor, pVal, n, df, t };
        
    }
}

export function  covMatrix (selector, isSample = false) {
    return data => {

        // stattrek.com/matrix-algebra/covariance-matrix.aspx

        let asMatrix = new dataset(data).matrix(selector);

        let result = // result is averages
            matrix.ones(asMatrix.data.length)
            .multiply(asMatrix)
            .multiply(1/asMatrix.data.length); 

        result = asMatrix.apply(result, (a,b) => a - b); // result is deviations
        result = result.transpose().multiply(result); // result is squared deviations        
        return result.multiply(1/(asMatrix.data.length - (isSample ? 1 : 0)));

    }
}

// No need for 'isSample' as with covMatrix, because 
// the results are the same for a sample vs a population.
export function corMatrix(selector) {
    return data => {
        // math.stackexchange.com/questions/186959/correlation-matrix-from-covariance-matrix/300775
        let cov = covMatrix(selector)(data);
        let STDs = cov.diagonal().apply(x => Math.pow(x,0.5));
        return STDs.inverse().multiply(cov).multiply(STDs.inverse());
    }
}

// CorMatrix gave the same results whether sample or population.  I wasn't familiar
// with that fact.  I had a very hard time googling this fact.  People said pop vs 
// sample were different (r vs rho, using s vs sigma).  But nobody was saying that 
// it would output the same whether you do n or n-1 (s vs sigma).  I saw that R didn't
// offer a pop vs sample 'cor' option.  I saw that Python's np.corrcoef 'bias' parameter
// was deprecated.  Their manual said this was because it didn't produce different
// resuts in the current and even in previous versions.  So at least they were having
// the same issue.  So, indications of equivalence everywhere, but nobody mentioned it 
// explicitly.  So I built this function just to calculate it more explicity in a way
// I could explicitly see following certain formulas I found for r vs rho, just to see
// if I would get the same matricies back again.  I did.  In the future I'll consider
// proving it (I imagine the size terms cancel out), but for now I'm moving on.     
function corMatrix2 (selector, isSample = true) {
    return data => {
        let cov = covMatrix(selector, isSample)(data);
        let STDs = cov.diagonal(true).apply(x => Math.pow(x,0.5));
        let SS = STDs.multiply(STDs.transpose());
        return cov.apply(SS, (x,y) => x / y);
    }    
}