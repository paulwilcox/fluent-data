
async function test () {

    // initializations
        
        let mx = new $$.matrix([
            [ 3.00,  8.23, -7.00],
            [ 4.55, -6.00,  2.00],
            [-9.00,  3.00,  5.92]
        ]);

        let mx2 = new $$.matrix([
            [ 1.52, 7.91, 8.44],
            [ 4.42, 3.20, 9.11],
            [ 2.22, 5.03, 6.23]
        ])

        let result;
        let expected;
        let sumAllCells = (matrix) => matrix.reduce('all', (a,b) => a + b).round(8).getCell(0,0);

    // add

        result = mx.add(mx2);
        if (sumAllCells(result) != 52.78)
            throw `mx.add(mx2) does not have the expected property.`;

    // apply

        result = mx.apply(cell => cell * 10);
        if (sumAllCells(result) != 47)
            throw `mx.apply(cell => cell * 10) does not have the expected property.`;
        
        result = mx.apply(mx2, (a,b) => a + b)
        if (sumAllCells(result) != 52.78)
            throw `mx.apply(mx2, (a,b) => a + b) does not have the expected property.`;

    // diagonal
        
        result = mx.diagonal();
        if (sumAllCells(result) != 2.92 || result.nRow != 3 || result.nCol != 3)
            throw `mx.diagonal() does not have the expected property.`;

        result = mx.diagonal(true);
        if (sumAllCells(result) != 2.92 || result.nRow != 3 || result.nCol != 1)
            throw `mx.diagonal() does not have the expected property.`;
            
    // multiply

        result = mx.multiply(mx2);
        if(sumAllCells(result) != 73.988)
            throw `mx.multiply(mx2) does not have the expected property`;

        let vectorTens = new $$.matrix([[10],[10],[10]]);
        result = mx.multiply(vectorTens);
        if(sumAllCells(result) != 47)
            throw `mx.multiply(vectorTens) does not have the expected property`;

        result = mx.multiply(10);
        if(sumAllCells(result) != 47)
            throw `mx.multiply(10) does not have the expected property.`;

    // pseudoInverse

        result = mx.pseudoInverse()
            .multiply(mx).round(8)
            .equals($$.matrix.identity(3));

        if (!result) 
            throw 'pseudoInverse multiplied by original did not produce identity matrix.';

    // reduce

        result = mx.reduce('row', (a,b) => a + b); 
        if(!result.round(8).transpose().equals(new $$.matrix([[4.23, 0.55, -0.08]])))
            throw `mx.reduce('row', (a,b) => a + b) did not result in the expected matrix.`;

        result = mx.reduce('col', (a,b) => a + b); 
        if(!result.round(8).equals(new $$.matrix([[-1.45, 5.23, 0.92]])))
            throw `mx.reduce('col', (a,b) => a + b) did not result in the expected matrix.`;
    
        result = mx.reduce('all', (a,b) => a + b);
        if(result.round(8).getCell(0,0) != 4.7)
            throw `mx.reduce('all', (a,b) => a + b) did not have the expected property.`;

        result = mx.reduce('all', (a,b) => a + b, 100); 
        if(result.round(8).getCell(0,0) != 104.7)
            throw `mx.reduce('all', (a,b) => a + b, 100) did not result in the expected matrix.`;

    // round

        result = mx.round(0);
        if (sumAllCells(result) != 5)
            throw `mx.round(0) does not have the expected property`;

    // solve

        let threes = $$.matrix.repeat(2,3);
        result = mx.solve(threes);
        if(!mx.multiply(result).equals(threes, 1e-8))
            throw `mx.solve(threes) did not result in mx.multiply(result) = threes`;

    // subtract

        result = mx.subtract(mx2);
        if (sumAllCells(result) != -43.38)
            throw `mx.subtract(mx2) does not have the expected property.`;

    // transpose

        result = mx.transpose();
        expected = new $$.matrix([
            [ 3.00,  4.55, -9.00],
            [ 8.23, -6.00,  3.00],
            [-7.00,  2.00,  5.92]
        ]);
        if(!result.equals(expected))
            throw `mx.transpose() did not produce the expected matrix.`;

    // validate

        let catchBad = (title, _mx) => {
            try { mx.validate(); throw `${title}: validate failed to catch a bad matrix`; }
            catch {}
        }
        catchBad('text', mx.apply(cell => 'a' + cell));
        catchBad('jagged', new $$.matrix([[1,2,3],[4,5]]))

return;




    // structure checks

        mx = new $$.matrix([[1, 0, 0], [4, 5, 0], [7, 8, 9]]);
        if (!mx.isLowerTriangular())
            throw `Lower trianguar matrix not identified as such`;

        mx = new $$.matrix([[1, 2, 3], [0, 5, 6], [0, 0, 9]]);
        if (!mx.isUpperTriangular())
            throw `Upper trianguar matrix not identified as such`;
    
    // terminations

        return true;

}
