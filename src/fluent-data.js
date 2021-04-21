import dataset from './dataset.js';
import grouping from './grouping.js';
import matrix from './matrix.js';
import * as g from './general.js';

export default function _(obj) { 
    if (!g.isIterable(obj))
        throw 'Object instantiating fluent_data must be iterable';
    return obj instanceof dataset ? obj : new dataset(obj);
}

_.fromJson = function(json) {

    let groupify = (arrayified) => {
        let parsed = g.isString(arrayified) 
            ? JSON.parse(arrayified) 
            : arrayified;
        let groupified = grouping.groupify(parsed);
        let ds = new dataset();
        ds.data = groupified.data;
        return ds;
    }

    return json.constructor.name == 'Response' 
        ? json.json().then(groupify)
        : groupify(json);

}

_.matrix = matrix;

_.round = g.round;

_.first = rowFunc =>
    data => {
        for (let row of data )
            if (rowFunc(row) !== undefined && rowFunc(row) !== null)
                return rowFunc(row);
        return null;
    }

_.last = rowFunc => 
    data => {
        for (let i = data.length - 1; i >= 0; i++)
            if (rowFunc(data[i]) !== undefined && rowFunc(data[i]) !== null)
                return rowFunc(data[i]);
        return null;
    }

_.sum = (rowFunc, options) => 
    data => {
        let agg = 0;
        for (let row of data) 
            agg += rowFunc(row);
        if (options && options.test) 
            agg = -agg;
        return agg;
    };

_.count = rowFunc => 
    data => {
        let agg = 0;
        for (let row of data) {
            let r = rowFunc(row)
            if (r !== undefined && r !== null)
                agg += 1;
        }
        return agg;
    };

_.avg = rowFunc => 
    data => {
        let s = _.sum(rowFunc)(data);
        let n = _.count(rowFunc)(data);
        return s / n;
    };

_.std = (rowFunc, isSample = false) => 
    data => {
        let m = _.avg(rowFunc)(data);
        let ssd = data.reduce((agg,row) => agg + Math.pow(rowFunc(row) - m,2), 0);
        let n = _.count(rowFunc)(data);
        if (isSample)
            n--;
        return Math.pow(ssd/n, 0.5);
    };

_.mad = rowFunc => 
    data => {

        let avg = _.avg(rowFunc)(data);
        let devs = [];

        for (let ix in data)
            devs[ix] = Math.abs(rowFunc(data[ix]) - avg);
    
        return _.avg(x => x)(devs);    

    };

_.cor = (rowFunc, options) => 
    data => {
    
        let xAvg = _.avg(v => rowFunc(v)[0])(data);
        let yAvg = _.avg(v => rowFunc(v)[1])(data);
        let n = _.count(v => rowFunc(v))(data);

        let diffs = [];
        for(let row of data) 
            diffs.push({ 
                xDiff: rowFunc(row)[0] - xAvg, 
                yDiff: rowFunc(row)[1] - yAvg
            });

        let xyDiff = _.sum(row => row.xDiff * row.yDiff)(diffs);
        let xDiffSq = _.sum(row => row.xDiff ** 2)(diffs);
        let yDiffSq = _.sum(row => row.yDiff ** 2)(diffs);

        let cor = xyDiff / (xDiffSq ** 0.5 * yDiffSq ** 0.5)
        let df = n - 2;
        let t =  g.studentsTfromCor(cor, n);
        let pVal = g.studentsTcdf(t, df);
            
        if (options === undefined)
            return cor;

        if (options.tails == 2)
            pVal *= 2;

        return { cor, pVal, n, df, t };
        
    };

// Rows with 'estimate', 'actual', and 'residual' fields will have them overwritten.
_.regress = (ivSelector, dvSelector, options) => 
    data => {

        // Initializations

            options = Object.assign(
                { estimates: true }, 
                options
            );

            // Output a selector of row properties that returns an array
            // and a set of labels (keys) that pertain to the array
            let processSelector = (selector) => {
                
                if (g.isString(selector)) {
                    let keys = selector.split(',').map(key => key.trim());
                    return [
                        keys,
                        (row) => keys.map(key => row[key])
                    ];
                }

                let keys = Object.keys(selector({}));
                return [
                    keys, 
                    (row) => keys.map(key => selector(row)[key])
                ];

            }

            let [ ivKeys, outerIvSelector ] = processSelector(ivSelector);
            let [ dvKeys, outerDvSelector ] = processSelector(dvSelector);

            if (ivKeys.length == 0)
                throw `ivSelector must return an object with explicit keys defined.`
            if (dvKeys.length != 1)
                throw `dvSelector must return an object with exactly one key defined.`

            let ivs = 
                new matrix(data, row => [1, ...outerIvSelector(row)] )
                .setColNames(`intercept,${ivKeys.join(',')}`);
                
            let dvs = new matrix(data, row => outerDvSelector(row));

            let n = data.length;
            let transposedIvs = ivs.transpose();

            // I think this translates to variances.
            let variances = transposedIvs.multiply(ivs).inverse();
            
        // Calcaulate the coefficients
                        
            let coefficients = 
                variances
                .multiply(transposedIvs)
                .multiply(dvs);

            coefficients = coefficients.data.map((row,ix) => ({ 
                name: coefficients.rowNames[ix], 
                value: row[0]
            }));
        
        // Calculate the row estimates and residuals

            for(let row of data)  {

                let actual = outerDvSelector(row);
                actual = actual.length == 1 ? actual[0] : undefined;
                
                let estimate =  
                    outerIvSelector(row)
                    .map((iv,ivIx) => iv * coefficients[ivIx + 1].value)
                    .reduce((a,b) => a + b, 0)
                    + coefficients[0].value; // intercept
                
                row.estimate = estimate;
                row.actual = actual;
                row.residual = actual - estimate;

            }

        // Calculate the coefficient statistics

            // kokminglee.125mb.com/math/linearreg3.html

            let s = Math.pow(
                (1 / (n - coefficients.length)) 
                * _.sum(row => Math.pow(row.estimate - row.actual, 2))(data),
                0.5
            )

            let stdErrs = 
                variances
                .multiply(Math.pow(s,2))
                .apply(cell => Math.pow(cell,0.5))
                .diagonal(true)
                .data;
            
            for(let c in coefficients) {
                coefficients[c].stdErr = stdErrs[c];
                coefficients[c].t = coefficients[c].value / stdErrs[c];
                coefficients[c].df = data.length - coefficients.length;
                coefficients[c].pVal = g.studentsTcdf(coefficients[c].t, coefficients[c].df) * 2;
                coefficients[c].ci = (quantile) => [
                    coefficients[c].value + g.studentsTquantile((1 - quantile)/2, coefficients[c].df) * coefficients[c].stdErr,
                    coefficients[c].value - g.studentsTquantile((1 - quantile)/2, coefficients[c].df) * coefficients[c].stdErr
                ]; 
                if (options && options.ci) // If the user passed ci, process the ci function.
                    coefficients[c].ci = coefficients[c].ci(options.ci);
            }

        // Calculate the model-level statistics

            // en.wikipedia.org/wiki/F-test (Regression Problems | p1 and p2 include the intercept)
            let mean = _.avg(row => row.actual)(data);
            let ssComplex = _.sum(row => Math.pow(row.estimate - row.actual, 2))(data);
            let ssSimple = _.sum(row => Math.pow(row.actual - mean, 2))(data);
            let paramsComplex = coefficients.length;
            let paramsSimple = 1;

            let F = ((ssSimple - ssComplex) / (paramsComplex - paramsSimple)) / 
                    (ssComplex/(n-paramsComplex))

            let rSquared = 1 - ssComplex / ssSimple; 

            // n - p - 1 = n - coefficients.length becasue p does not include the intercept
            let rSquaredAdj = 1 - (1 - rSquared) * (n - 1) / (n - coefficients.length); 

        // Regress the squared residuals

            // youtube.com/watch?v=wzLADO24CDk

            let breuchPagan;
            let breuchPaganPval;

            if (options.estimates) {

                // We'll need to save these because rerunning regress will 
                // overwrite the properties.  But we need the original values
                // back in the final output.
                let clonedProps = data.map(row => ({
                    actual: row.actual, 
                    estimate: row.estimate, 
                    residual: row.residual
                }));

                let residRegress = _.regress(
                    ivSelector, 
                    row => [Math.pow(row.residual,2)], 
                    { estimates: false } // block estimtes to avoid infinite recursion.
                )(data);

                let r2 = residRegress.model.rSquared;
                let p = residRegress.coefficients.length - 1; // seems intercept doesn't count here.
                breuchPagan = r2 * n;
                breuchPaganPval = g.chiCdf(breuchPagan, p);

                // Restore the original values.
                for(let rowIx in data)  {
                    data[rowIx].actual = clonedProps[rowIx].actual;
                    data[rowIx].estimate = clonedProps[rowIx].estimate;
                    data[rowIx].residual = clonedProps[rowIx].residual;
                }
                    

            }

        // Terminations
            
            let results = {
                data: new dataset(data),
                coefficients,
                model: {
                    rSquared,
                    rSquaredAdj,
                    F,
                    pVal: g.Fcdf(F, paramsComplex - paramsSimple, n - paramsComplex)
                }
            }; 

            if (breuchPagan != undefined) 
                Object.assign(results.model, {breuchPagan, breuchPaganPval});

            if (options.maxDigits) {
                g.RoundObjectNumbers(results.coefficients, options.maxDigits);
                g.RoundObjectNumbers(results.model, options.maxDigits);
                for(let row of results.data) {
                    row.actual = g.round(row.actual, options.maxDigits);
                    row.estimate = g.round(row.estimate, options.maxDigits);
                    row.residual = g.round(row.residual, options.maxDigits);
                }
            }

            return results;

    }

_.covMatrix = (selector, isSample = true) =>
    data => {

        // stattrek.com/matrix-algebra/covariance-matrix.aspx

        let asMatrix = _(data).matrix(selector);

        let result = // result is averages
            matrix.ones(asMatrix.data.length)
            .multiply(asMatrix)
            .multiply(1/asMatrix.data.length); 

        result = asMatrix.apply(result, (a,b) => a - b); // result is deviations
        result = result.transpose().multiply(result); // result is squared deviations        
        return result.multiply(1/(asMatrix.data.length - (isSample ? 1 : 0)));

    }

// No need for 'isSample' as with covMatrix, because 
// the results are the same for a sample vs a population.
_.corMatrix = (selector) =>
    data => {
        // math.stackexchange.com/questions/186959/correlation-matrix-from-covariance-matrix/300775
        let cov = _.covMatrix(selector)(data);
        let STDs = cov.diagonal().apply(x => Math.pow(x,0.5));
        return STDs.inverse().multiply(cov).multiply(STDs.inverse());
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
_.corMatrix2 = (selector, isSample = true) =>
    data => {
        let cov = _.covMatrix(selector, isSample)(data);
        let STDs = cov.diagonal(true).apply(x => Math.pow(x,0.5));
        let SS = STDs.multiply(STDs.transpose());
        return cov.apply(SS, (x,y) => x / y);
    }    