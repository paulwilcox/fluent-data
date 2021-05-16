/*
    Factor analysis:
        - Applied MultiVariate Statistical Analysis.pdf (p491 pdf 512)

    Rotation:
        - Kaiser 1958 pdf on desktop p8
        - www.real-statistics.com/linear-algebra-matrix-topics/varimax/
            > Note that his numerator (X) is Dk - 2AB, 
            > Based on Kaiser I think it should be 2(k - AB)
            > But his general workthrough is still very helpful and a great crosscheck
        - archive.org/details/ModernFactorAnalysis/page/n323/mode/1up?q=varimax (p304)
*/

let { matrix } = require('../dist/fluent-data.server.js');
let $$ = require('../dist/fluent-data.server.js')
test();


function test() {

    let _math = (ar,al) => ({ arithmetic: ar, algebra: al });
    let _lang = (r,w) => ({ reading: r, writing: w });

    let data = new $$([/*
        { name: 'Pat', ..._math(65, 63), ..._lang(95, 97) },
        { name: 'Kelly', ..._math(62, 65), ..._lang(94, 96) },
        { name: 'Jessie', ..._math(96, 98), ..._lang(64, 61) },
        { name: 'Chris', ..._math(93, 95), ..._lang(61, 64) },
        { name: 'Alex', ..._math(5, 3), ..._lang(45, 47) },
        { name: 'Drew', ..._math(2, 5), ..._lang(44, 46) },
        { name: 'Jordan', ..._math(46, 48), ..._lang(4, 1) },
        { name: 'Cam', ..._math(43, 45), ..._lang(1, 4) },
        { name: 'Noisy', ..._math(75, 25), ..._lang(75, 25) },
        { name: 'Hazy', ..._math(25, 75), ..._lang(25, 75) },*/
        
        { name: 'Pat', ..._math(65, 63), ..._lang(95, 10) },
        { name: 'Kelly', ..._math(62, 65), ..._lang(94, 10) },
        { name: 'Jessie', ..._math(96, 98), ..._lang(64, 10) },
        { name: 'Chris', ..._math(93, 95), ..._lang(61, 11) },
        { name: 'Alex', ..._math(5, 3), ..._lang(55, 11) },
        { name: 'Drew', ..._math(2, 5), ..._lang(54, 11) },
        { name: 'Jordan', ..._math(46, 48), ..._lang(4, 10) },
        { name: 'Cam', ..._math(43, 45), ..._lang(1, 11) },
        { name: 'Noisy', ..._math(75, 25), ..._lang(75, 10) },
        { name: 'Hazy', ..._math(25, 75), ..._lang(25, 11) }
    ]);

    let factorized = factorize(
        data,
        'arithmetic, algebra, reading, writing'
    );

    console.log(factorized);

}

function factorize (dataset, explicitVars) {
    
    let eigenArgs = {valueThreshold: 1e-12, vectorThreshold: 1e-4, testThreshold: 1e-3};
    let maxFactors = null; // null for no max
    let minEigenVal = 1; // null for no threshold
    let rotationMaxIterations = 1000;
    let rotationAngleThreshold = 1e-8;

    let wrapLoadings = (loads) => {

        let communalities = loads
            .apply(cell => cell*cell)
            .reduce('row', (a,b) => a + b)
            .setColNames('communality');
        
        let specificVars = communalities
            .apply(cell => 1-cell)
            .setColNames('specificVar');
        
        let factorSumSqs = loads
            .apply(cell => cell*cell)
            .reduce('col', (a,b) => a + b)
            .setRowNames('sumSqs');

        let sumCom = communalities.reduce('all', (a,b) => a + b).getCell(0,0);

        let sums = Array(loads.nCol).fill(null);
        sums.push(...[
            communalities.reduce('all', (a,b) => a + b).getCell(0,0),
            specificVars.reduce('all', (a,b) => a + b).getCell(0,0)
        ]);
        sums = new $$.matrix([sums]).setRowNames('sums');
        
        let props = factorSumSqs
            .apply(sumSq => sumSq / sumCom)
            .setRowNames('propVars');

        let printable = loads
            .appendCols(communalities)
            .appendCols(specificVars)
            .appendRows(sums)
            .appendRows(factorSumSqs)
            .appendRows(props);

        let log = (title, roundDigits) => printable.log(
            null, 
            title, 
            r => $$.round(r,roundDigits),
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
            log
        };

    }

    // Calculate the correlations and get the factors

        let correlations = 
            dataset
            .reduce($$.corMatrix(explicitVars))
            .data;
        
        let eigen = correlations.eigen(eigenArgs);    

    // Produce the loadings
  
        let loadings = [] ;
        for (let i = 0; i < eigen.values.length; i++) {
            if (maxFactors && i > maxFactors) 
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
        loadings = new $$.matrix(loadings).transpose();
        loadings.rowNames = correlations.rowNames;
        loadings.colNames = loadings.colNames.map((cn,ix) => `factor ${ix}`);

        let unrotated = wrapLoadings(loadings);

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
        
                let rotator = new $$.matrix([
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

        let rotated = wrapLoadings(loadings);

    // terminations

        correlations.log(null, 'correlations', row => $$.round(row,4));
        console.log('eigenValues:', $$.round(eigen.values,4))
        unrotated.log('loadings', 4);
        rotated.log('rotated', 4);
          
}

