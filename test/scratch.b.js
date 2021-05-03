
async function test() {

    // Applied MultiVariate Statistical Analysis.pdf (p491 pdf 512)

    let maxFactors = null; // null for no max
    let eigenThreshold = 1; // null for no threshold
  
    let eigen = new $$.matrix([
        [1.00, 0.02, 0.96, 0.42, 0.01],
        [0.02, 1.00, 0.13, 0.71, 0.85],
        [0.96, 0.13, 1.00, 0.50, 0.11],
        [0.42, 0.71, 0.50, 1.00, 0.79],
        [0.01, 0.85, 0.11, 0.79, 1.00]
    ]).eigen(1e-8);

    eigen.values = 
        eigen.values.filter((ev,ix) => 
              maxFactors !== null && ix > maxFactors ? false
            : eigenThreshold !== null && ev < eigenThreshold ? false
            : true
        );

    console.log('eigenvalues:', eigen.values);
    
    let loadings = [];
    for (let i = 0; i < eigen.values.length; i++) {
        let loading = 
            eigen.vectors.get(null, i)
            .multiply(Math.pow(eigen.values[i],0.5));
        loadings.push(loading.transpose().data[0]); // it's a vector, just get it
    }
    loadings = new $$.matrix(loadings).transpose();
    loadings.log(null, 'loadings', row => $$.round(row, 8));

    let communalities = loadings.apply(cell => cell*cell).reduce('row', (a,b) => a + b);
    communalities.log(null, 'communalities', row => $$.round(row, 8));

    let specificVars = communalities.apply(cell => 1-cell);
    specificVars.log(null, 'specificVars', row => $$.round(row, 8));

////////////////////////////////////////////////////////////////////////////////////////////

    // Kaiser 1958 pdf on desktop p8
    // https://www.real-statistics.com/linear-algebra-matrix-topics/varimax/
    //   Note that his numerator (X) is Dk - 2AB, 
    //   Based on Kaiser I think it should be 2(k - AB)
    //   But his general workthrough is still very helpful and a great crosscheck
    // https://archive.org/details/ModernFactorAnalysis/page/n323/mode/1up?q=varimax (p304)

    // TODO: make these parameters
    let rotationMaxIterations = 100
    let rotationAngleThreshold = 0.0001

    // TODO: Delete resettings
    console.log('loadings and communalities reset');
    loadings = new $$.matrix([
        [-0.184440,  0.766739, -0.277580,  0.115158],
        [0.698485, -0.303630, -0.195390, -0.264800],
        [0.754094,  0.348652, -0.202050, -0.305880],
        [0.365978,  0.162525, -0.197300,  0.849845],
        [0.578163,  0.044134,  0.452722,  0.157895],
        [0.299667,  0.030388,  0.770856,  0.063739],
        [0.817187,  0.239353, -0.194510, -0.166430], 
        [0.687893,  0.035304,  0.116032,  0.117627], 
        [0.301458, -0.741080, -0.344200,  0.233979]
    ]);
    communalities = loadings.apply(cell => cell*cell).reduce('row', (a,b) => a + b);
    communalities.log(null, 'c2')

    let preNormalized = communalities.apply(cell => Math.pow(cell, 0.5));
    let normalized = loadings.clone();
    for(let c = 0; c < normalized.nCol; c++)
    for(let r = 0; r < normalized.nRow; r++) 
        normalized.data[r][c] = normalized.data[r][c] / preNormalized.data[r][0];    
    normalized.log(null, 'normalized', row => $$.round(row, 8))
    
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
                normalized.get(null,leftCol)
                .appendCols(normalized.get(null,rightCol));
                      
            let U = mxSquare(subset.get(null,0)).subtract(mxSquare(subset.get(null,1)));
            let V = mxCellMult(subset.get(null,0), subset.get(null,1)).multiply(2);

            let num = 2 * (loadings.nRow * mxSum(mxCellMult(U,V)) - mxSum(U) * mxSum(V));
            let den = 
                loadings.nRow * mxSum(mxSquare(U).subtract(mxSquare(V))) 
                - (Math.pow(mxSum(U),2) - Math.pow(mxSum(V),2));
            let angle = 0.25 * Math.atan(num/den)
            
            if(angle > maxAngle || maxAngle == null)
                maxAngle = angle;
    
            let rotator = new $$.matrix([
                [Math.cos(angle), -Math.sin(angle)],
                [Math.sin(angle), Math.cos(angle)]
            ]);
            subset = subset.multiply(rotator);

            for(let r = 0; r < normalized.nRow; r++) {
                normalized.data[r][leftCol] = subset.data[r][0];
                normalized.data[r][rightCol] = subset.data[r][1];
            }

        }
              
    }
              
    normalized.log(null, 'rotated', row => $$.round(row, 8));

}

