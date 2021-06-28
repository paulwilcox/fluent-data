import dataset from '../dataset.js';
import matrix from '../matrix.js';
import * as redu from './general.js';
import * as g from '../general.js';

export default function dimReduce (
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
            .reduce(redu.corMatrix(explicitVars))
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

        let unrotated = _wrapLoadings(loadings);

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

        let rotated = _wrapLoadings(loadings);

    // terminations

        let results = {
            rotated,
            unrotated,
            eigenValues: eigen.values,
            correlations
        };

        if (attachData)
            results.data = _scoreTheData(data, explicitVars, correlations, rotated.loadings);

        results.log = (element, masterCaption, roundDigits) => {

            let rounder = roundDigits !== undefined ? (row) => g.round(row,roundDigits) : x => x;
            
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

function _scoreTheData (data, explicitVars, correlations, loadings) {

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

function _wrapLoadings (loads) {

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