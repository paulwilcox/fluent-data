async function test () {

    let data = await sample('philosophites, mathematicians');

    let check = source => { 
        let looksGood = 
            results.filter(x => x.id == 'a').length == 1 &&
            results.filter(x => x.id == 'b').length == 1 &&
            results.filter(x => x.id == 'c').length == 1;
        if (!looksGood) throw `
            Results do not resemble the output of 'both both'.
            source = '${source}'; 
        `;
    }

    // Will a hash failure change to loop?
    let results = 
        $$({
            p: data.philosophites,
            m: data.mathematicians
        })
        .merge(
            (p,m) => p.id == m.id || p.id == 'z', 
            'both both'
        )
        .get(p => p);

    check('hash fail');
        
    // Does the mapper as object of options work?  
    results = 
        $$({
            p: data.philosophites,
            m: data.mathematicians
        })
        .merge((p,m) => p.id == m.id, {
            leftHasher: x => x.id,
            rightHasher: x => x.id,
            mapper: 'both both'
        })
        .get(p => p);

    check('left right hashers');

    // Does the mapper as object of options work?  
    results = 
        $$({
            p: data.philosophites,
            m: data.mathematicians
        })
        .merge(
            (p,m) => p.id == m.id, {
                hasher: x => x.id,
                mapper: 'both both'
            },
            $$.mergeMethod.hash
        )
        .get(p => p);

    check('hashers');

    // TODO: Merge on full object equality

    return true;

}