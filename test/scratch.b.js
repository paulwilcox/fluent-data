async function test () {

    //let data = await sample('orders');

    let data = [
        { cases: 7, distance: 560, time: 16.68 },
        { cases: 3, distance: 220, time: 11.50 },
        { cases: 3, distance: 340, time: 12.03 },
        { cases: 4, distance: 80, time: 14.88 },
        { cases: 6, distance: 150, time: 13.75 },
        { cases: 7, distance: 330, time: 18.11 }
    ];
    
    let matrix = $$(data)
        .matrix(row => [1, row.cases, row.distance])
        .setColNames('dummy, cases, distance');
        
    let vector = $$(data).matrix('time');
    let transposed = matrix.clone().transpose();
    
    let results = 
        transposed.clone()
        .multiply(matrix)
        .inverse()
        .multiply(transposed)
        .multiply(vector);
    
    console.log(results.data) // Matches lm() coefficients in R!

    return true;

}