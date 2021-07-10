import dataset from './dataset.js';
import matrix from './matrix.js';
import * as g from './general.js';

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

export function dimReduce (
    explicitVars, 
    {
        eigenArgs = {}, // empty object for defaults in initializations
        maxDims = null, // null for no max
        minEigenVal = 1, // null for no threshold
        rotationMaxIterations = 1000,
        rotationAngleThreshold = 1e-8,
        attachData = false
    } = {}
) { return data => {
  
    // Initializations

        eigenArgs.valueThreshold  = eigenArgs.valueThreshold || 1e-12;
        eigenArgs.vectorThreshold = eigenArgs.vectorThreshold || 1e-4;
        eigenArgs.testThreshold = eigenArgs.testThreshold || 1e-3;

    // Calculate the correlations and get the dimensions

        let correlations = 
            new dataset(data)
            .reduce(corMatrix(explicitVars))
            .data;
        
        let eigen = correlations.eigen(eigenArgs);    

    // Produce the loadings
  
        let loadings = [] ;
        for (let i = 0; i < eigen.values.length; i++) {
            if (maxDims && i > maxDims) 
                continue;
            else if (minEigenVal && eigen.values[i] < minEigenVal)
                continue;

            let loading = 
                eigen.vectors.get(null, i)
                .multiply(Math.pow(eigen.values[i],0.5))
                .transpose()
                .data[0]; // it's a vector, just get it
            loadings.push(loading); 
        }
        loadings = new matrix(loadings).transpose();
        loadings.rowNames = correlations.rowNames;
        loadings.colNames = loadings.colNames.map((cn,ix) => `dim${ix}`);

        let unrotated = _dimReduce_wrapLoadings(loadings);

    // 'Normalize' the loadings in preparation for rotation
        
        let comRoots = unrotated.communalities.apply(cell => Math.pow(cell, 0.5));
        loadings = loadings.clone();

        for(let c = 0; c < loadings.nCol; c++)
        for(let r = 0; r < loadings.nRow; r++) 
            loadings.data[r][c] = loadings.data[r][c] / comRoots.data[r][0];    

    // Rotate 
        
        let iterations = 0;
        let maxAngle = null;
        let mxSum = (matrix) => matrix.reduce('all', (a,b)=>a+b).data[0][0];
        let mxCellMult = (mxA, mxB) => mxA.apply(mxB, (a,b) => a*b);
        let mxSquare = (matrix) => matrix.apply(cell => cell*cell);

        while (
            iterations++ < rotationMaxIterations 
            && (maxAngle > rotationAngleThreshold || maxAngle == null)
        ) {
        
            maxAngle = null;

            for(let leftCol = 0; leftCol < loadings.nCol - 1; leftCol++)
            for(let rightCol = 1; rightCol < loadings.nCol; rightCol++) {
        
                let subset = 
                    loadings.get(null,leftCol)
                    .appendCols(loadings.get(null,rightCol));
                        
                let U = mxSquare(subset.get(null,0)).subtract(mxSquare(subset.get(null,1)));
                let V = mxCellMult(subset.get(null,0), subset.get(null,1)).multiply(2);

                let num = 2 * (loadings.nRow * mxSum(mxCellMult(U,V)) - mxSum(U) * mxSum(V));
                let den = loadings.nRow 
                    * mxSum(mxSquare(U).subtract(mxSquare(V))) 
                    - (Math.pow(mxSum(U),2) - Math.pow(mxSum(V),2));
                let angle = 0.25 * Math.atan(num/den);
                
                if(angle > maxAngle || maxAngle == null)
                    maxAngle = angle;
        
                let rotator = new matrix([
                    [Math.cos(angle), -Math.sin(angle)],
                    [Math.sin(angle), Math.cos(angle)]
                ]);
                subset = subset.multiply(rotator);

                for(let r = 0; r < loadings.nRow; r++) {
                    loadings.data[r][leftCol] = subset.data[r][0];
                    loadings.data[r][rightCol] = subset.data[r][1];
                }

            }
                
        }

    // undo the normalization 

        for(let c = 0; c < loadings.nCol; c++)
        for(let r = 0; r < loadings.nRow; r++) 
            loadings.data[r][c] = loadings.data[r][c] * comRoots.data[r][0];        

        let rotated = _dimReduce_wrapLoadings(loadings);

    // terminations

        let results = {
            rotated,
            unrotated,
            eigenValues: eigen.values,
            correlations
        };

        if (attachData)
            results.data = _dimReduce_scoreTheData(data, explicitVars, correlations, rotated.loadings);

        results.log = (element, masterCaption, roundMultiple) => {

            let rounder = roundMultiple !== undefined ? (row) => g.round(row,roundMultiple) : x => x;
            
            if (masterCaption) 
                console.log(`-----------------------------------\r\n${masterCaption}`);

            console.log('\r\n\r\n' + 
                'For guidance on how to query dimResults, ' + 
                'call "dimResults.help" on the fluent-data object, ' + 
                'or see the github wiki for this project'
            );

            rotated.log(element, '\r\nrotated:', rounder);
            unrotated.log(element, '\r\nunrotated:', rounder);
            console.log('\r\neigenValues:', rounder ? eigen.values : eigen.values.map(rounder));
            correlations.log(element, '\r\ncorrelations:', rounder);
            
            if (attachData)
                console.log(
                    '\r\n\r\nNote: Data has been output with dimScores attached.  ' +
                    'Query "data" on the return object to get it.  '
                );

            if (masterCaption)
                console.log(`-----------------------------------`);

        }

        return results;

}}

dimReduce.help = `

    dimReduce returns an object with the following properties:
    
        - rotated: rotated dimension properties { loadings, communalities, sums, sumSqs, 
          props, log }.  'log' is a printer that outputs these in a single table.
        - unrotated: unrotated dimension properties (same structure as above).
        - eigenValues: an array of the full set of dimensions output from the correlation matrix
        - correlations: a matrix of the correlation matrix 
        - data: if attachData = true, then the original data with dim scores appended
        - log: a method to display the output described above in friendly form

    See the github 'built-in reducers' wiki page for this library for more information.  

`;

function _dimReduce_scoreTheData (data, explicitVars, correlations, loadings) {

    let corInv = correlations.pseudoInverse();
    let zs = new matrix([...new dataset(data).standardize(explicitVars).data], explicitVars);

    let l_by_cor = loadings.transpose().multiply(corInv);
    
    for(let r = 0; r < zs.nRow; r++) {
         let scores = l_by_cor.multiply(zs.get(r).transpose()).transpose().get();
         for(let dim = 0; dim < scores.nCol; dim++)
            data[r][`dim${dim}`] = scores.data[0][dim];
    }

    return new dataset(data);

}

function _dimReduce_wrapLoadings (loads) {

    let communalities = loads
        .apply(cell => cell*cell)
        .reduce('row', (a,b) => a + b)
        .setColNames('communality');
    
    let specificVars = communalities
        .apply(cell => 1-cell)
        .setColNames('specificVar');
    
    let sumSqs = loads
        .apply(cell => cell*cell)
        .reduce('col', (a,b) => a + b)
        .setRowNames('sumSqs');

    let sumCom = communalities.reduce('all', (a,b) => a + b).getCell(0,0);

    let sums = Array(loads.nCol).fill(null);
    sums.push(...[
        communalities.reduce('all', (a,b) => a + b).getCell(0,0),
        specificVars.reduce('all', (a,b) => a + b).getCell(0,0)
    ]);
    sums = new matrix([sums]).setRowNames('sums');
    
    let props = sumSqs
        .apply(sumSq => sumSq / sumCom)
        .setRowNames('propVars');

    let printable = loads
        .appendCols(communalities)
        .appendCols(specificVars)
        .appendRows(sums)
        .appendRows(sumSqs)
        .appendRows(props);

    let log = (element, title, mapper) => printable.log(
        element, 
        title, 
        mapper,
        50,
        {
            headers: true,
            preferEmptyStrings: true,
            bordersBefore: [[loads.nRow],[loads.nCol]]
        }
    ); 

    return {
        loadings: loads,
        communalities,
        sums,
        sumSqs,
        props,
        log
    };

}

export function regress (
    ivSelector, 
    dvSelector, 
    {
        attachData = false,
        ci = null
    } = {}
) { return data => {

    // Initializations

        let [ ivKeys, outerIvSelector ] = _regress_processSelector(ivSelector);
        let [ dvKeys, outerDvSelector ] = _regress_processSelector(dvSelector);

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
            * sum(row => Math.pow(row.estimate - row.actual, 2))(data),
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
        let mean = avg(row => row.actual)(data);
        let ssComplex = sum(row => Math.pow(row.estimate - row.actual, 2))(data);
        let ssSimple = sum(row => Math.pow(row.actual - mean, 2))(data);
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

        results.log = (element, masterCaption, roundMultiple) => {

            let rounder = (x) => !roundMultiple ? x : g.round(x, roundMultiple);

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
function _regress_processSelector(selector) {

    let keys = selector.split(',').map(key => key.trim());
    return [
        keys,
        (row) => keys.map(key => row[key])
    ];

}