
async function test () {

    let mx = new $$.matrix([
        [    1, 0 ],
        [ -0.1, 1 ]
    ])
    .setRowNames(['theatre', 'bathroom']);

    mx.get('theatre').log();

}

