async function test () {

    let data = await sample('philosophites, mathematicians');

    // will a hash failure change to loop?
    let results = 
        $$({
            p: data.philosophites,
            m: data.mathematicians
        })
        .merge(
            (p,m) => p.id == m.id && p.id == 'a', 
            'both both'
        )
        .get(p => p);

    return true;

}