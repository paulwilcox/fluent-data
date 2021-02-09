
async function test () {

    let mx = new $$.matrix([
        [ 3, -1,  2],
        [ 3, -1,  6],
        [-2,  2, -2]
    ])
    
    let eigen = mx.eigen(1e-8);    

    $$.matrix.logMany(eigen);

}
