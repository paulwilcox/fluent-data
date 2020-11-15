async function test () {

    // TODO: matrix.get managing names and zero-length inputs and outputs.

    let mx = new $$.matrix([
        [3, 8, 7, 9],
        [4, 6, 2, 1],
        [9, 3, 5, 5],
        [1, 2, 4, 2]
    ]);

    console.log(mx);
    console.log(mx.clone().get([0,1], [2,3]));
   
    return true;

}
