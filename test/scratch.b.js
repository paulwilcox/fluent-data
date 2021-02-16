
async function test () {

    let mx = new $$.matrix([
        [    1, 0 ],
        [ -0.1, 1 ]
    ]);

    let eigen = mx.eigen({valueLoopMax: 10000});

    $$.matrix.logMany(eigen);

}

