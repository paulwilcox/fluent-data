
async function test () {

    let left =  [
        { id: 0, lLabel: 'zero' },
        { id: 1, lLabel: 'one' },
        { id: 1, lLabel: '??' },
        { id: 2, lLabel: '??' }  
    ];

    let right = [
        { id: 0, rLabel: 'zero' },
        { id: 1, rLabel: 'one' },
        { id: 1, rLabel: '??' },
        { id: 2, rLabel: '??' }  
    ];

    let results = 
        $$({ l: left, r: right })
        .merge((l,r) => 
            l.id == r.id, 
            (l,r) => ({ label: l.lLabel || r.rLabel }), 
            $$.mergeMethod.hashDistinct
        )
        .get(l => l);

    console.log(results);

    return true;

}