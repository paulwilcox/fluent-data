import * as g from '../general.js';
import matrix from '../matrix.js';
import dataset from '../dataset.js';
import * as redu from './general.js';

export default function regress (
    ivSelector, 
    dvSelector, 
    {
        attachData = false,
        ci = null
    } = {}
) { return data => {

    // Initializations

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
            * redu.sum(row => Math.pow(row.estimate - row.actual, 2))(data),
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
            if (ci) // If the user passed ci, process the ci function.
                coefficients[c].ci = coefficients[c].ci(ci);
        }

    // Calculate the model-level statistics

        // en.wikipedia.org/wiki/F-test (Regression Problems | p1 and p2 include the intercept)
        let mean = redu.avg(row => row.actual)(data);
        let ssComplex = redu.sum(row => Math.pow(row.estimate - row.actual, 2))(data);
        let ssSimple = redu.sum(row => Math.pow(row.actual - mean, 2))(data);
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

        if (attachData) {

            // We'll need to save these because rerunning regress will 
            // overwrite the properties.  But we need the original values
            // back in the final output.
            let clonedProps = data.map(row => ({
                actual: row.actual, 
                estimate: row.estimate, 
                residual: row.residual
            }));

            let residRegress = regress(
                ivSelector, 
                'resSq', 
                { estimates: false } // block estimtes to avoid infinite recursion.
            )(
                data.map(row => ({...row, resSq: Math.pow(row.residual,2)}))
            );

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
            coefficients,
            model: {
                rSquared,
                rSquaredAdj,
                F,
                pVal: g.Fcdf(F, paramsComplex - paramsSimple, n - paramsComplex)
            }
        }; 

        if (attachData)
            results.data = new dataset(data);

        if (breuchPagan != undefined) 
            Object.assign(results.model, {breuchPagan, breuchPaganPval});

        results.log = (element, masterCaption, roundDigits) => {

            let rounder = (x) => !roundDigits ? x : g.round(x, roundDigits);

            if (masterCaption) 
                console.log(`-----------------------------------\r\n${masterCaption}`);

            console.log('\r\n\r\n' + 
                'For guidance on how to query regress, ' + 
                'call "regress.help" on the fluent-data object, ' + 
                'or see the github wiki for this project'
            );

            new dataset(results.coefficients).log(element, '\r\ncoefficients:', rounder);
            
            console.log(
                '\r\nmodel:', 
                JSON.stringify(rounder(results.model),null,2).replace(/"/g,'')
            );

            if (results.data)
                console.log(
                    '\r\n\r\nNote: Data has been output with estimates attached.  ' +
                    'Query "data" on the return object to get it.  '
                );

            if (masterCaption)
                console.log(`-----------------------------------`);

        }

        return results;

}}

regress.help = `

    regress returns an object with the following properties:
    
        - coefficients: A dataset containing properties of the regression coefficients.
        - model: an object with the following properties: rSquared, rSquaredAdj, F, pVal.  
          If attachData = true, then also breuchPagan and breuchPaganPval.
        - data: if attachData = true, then the original data with estimates appended
        - log: a method to display the output described above in friendly form

    See the github 'built-in reducers' wiki page for this library for more information.  

`;

// Output a selector of row properties that returns an array
// and a set of labels (keys) that pertain to the array
function processSelector(selector) {

    let keys = selector.split(',').map(key => key.trim());
    return [
        keys,
        (row) => keys.map(key => row[key])
    ];

}