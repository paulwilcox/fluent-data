async function test () {
    
    let mx = new $$.matrix([
        [1, 2, 3, 4],
        [5, 6, 7, 8]
    ]);

    for(let col of mx.cols) {
        col.log();
    }

    for(let col of mx.cols) {
        col.log();
    }


}