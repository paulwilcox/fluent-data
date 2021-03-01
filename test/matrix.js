
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

    // determinant

        if($$.round(mx.determinant(), 4) != -211.9333)
            throw `Matrix determinant is not the expected value.`;

    // equals

        let shifted = mx.apply(cell => cell + 0.01).setColNames(['go','run','amok']);
        
        if (mx.equals(shifted))
            throw `mx.equals(shifted) is true when it should be false.`;

        if (!mx.equals(shifted, 1e-2))
            throw `mx.equals(shifted, 1e-2) is false when it should be true`;
        
        if (mx.equals(shifted, 1e-2, false))
            throw `mx.equals(shifted, 1e-2, false) is true when it should be false due to col names`;

    // isDiagonal

        let diag = new $$.matrix([
            [ 1, 0, 0.01  ],
            [ 0, 2, 0.001 ],
            [ 0, 0, 3     ]
        ]);

        if (diag.isDiagonal())
            throw `diag.isDiagonal() returns true when it should return false`;

        if (!diag.isDiagonal(1e-2))
            throw `diag.isDiagonal(1e-2) returns false when it should return true`;
        
    // isLowerTriangular

        let lt = new $$.matrix([
            [ 1, 0, 0.01 ],
            [ 2, 3, 0    ],
            [ 3, 4, 5    ]
        ]);

        if (lt.isLowerTriangular())
            throw `lt.isLowerTriangular() returns true when it should be false`;

        if (!lt.isLowerTriangular(1e-2))
            throw `lt.isLowerTriangular(1e-2) returns false when it should be true`;

    // isOrthonormal

        let ortho = new $$.matrix([
            [ 0.70651989,  0.70769319 + 0.01 ],
            [ 0.70769319, -0.70651989          ]
        ]);

        if (ortho.isOrthonormal())
            throw `ortho.isOrthonormal() returns true when it should be false`;
        
        if (!ortho.isOrthonormal(0.1))    
            throw `ortho.isOrthonormal(0.1) returns false hwen it should be true`;

    // isSquare

        if (!mx.isSquare())
            throw `mx.isSquare returns false when it should be true`;

        if (new $$.matrix([[1,2,3],[4,5,6]]).isSquare())
            throw `new $$.matrix(...).isSquare() returns true when it should be false`;

    // isUpperTriangular
            
        let ut = new $$.matrix([
            [     1, 2, 3 ],
            [     0, 4, 5 ],
            [ 0.001, 0, 6 ]
        ]);
    
        if (ut.isUpperTriangular())
            throw `ut.isUpperTriangular() returns true when it should be false`;   
            
        if (!ut.isUpperTriangular(1e-2))
            throw `ut.isUpperTriangular(1e-2) returns false when it should be true`;

    // norm

        if ($$.round(mx.norm(),5) != 17.64885)
            throw `euclidian/frobesnius norm not the expected value`;
        
        if ($$.round(mx.norm(1),3) != 17.23)
            throw `one-norm not the expected value`;

        if ($$.round(mx.norm('i'),2) != 18.23)
            throw `infinity-norm not the expected value`;

    // identity

        if (!$$.matrix.identity(2).equals(new $$.matrix([[1,0],[0,1]])))
            throw `$$.matrix.identity(2) not producing a 2x2 identity matrix`;

    // ones

        if (!$$.matrix.ones(2).equals(new $$.matrix([[1,1],[1,1]])))
            throw `$$.matrix.ones(2) not producing a 2x2 matrix of ones`;

    // randomizer

        result = new $$.matrix.randomizer().setSize(2,3).setValues(-5,5).get();
        let _randMsg;

        if (result.nRow != 2 || result.nCol != 3)
            _randMsg = `randomized matrix has nRow or nCol outside the bounds of .setSize()`;
        
        for (let row of result.rows)
            for (let cell of row.cols)
                if (Math.abs(cell.getCell(0,0)) > 5)
                    _randMsg `randomized matrix has a cell outside the bounds of .setValues()`;

        if (_randMsg) {
            console.error('Randomized matrix did not produce the expected results.');
            console.error('The randomized matrix is as follows:');
            result.log();
            throw _randMsg;
        }

    // repeat

        if (!$$.matrix.repeat(9,2,3).equals(new $$.matrix([[9,9,9],[9,9,9]])))
            throw `$$.matrix.repeat(9,2,3) not producing a 2x3 matrix of nines`;

    // zeroes

        if (!$$.matrix.zeroes(2).equals(new $$.matrix([[0,0],[0,0]])))
            throw `$$.matrix.ones(2) not producing a 2x2 matrix of zeroes`;

    // terminations

        return true;

}
