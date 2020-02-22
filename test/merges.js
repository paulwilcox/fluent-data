async function test () {

    let data = await sample('philosophites, mathematicians');

    let results = 
        $$({
            p: data.philosophites,
            m: data.mathematicians
        })
        .merge((p,m) => p.id == m.id, (p,m) => p)
        .execute(p => p);

console.log({results})

    return results.length == 5 
        && results.find(row => row.id == 'c').subject == 'Confucius'
        && results.find(row => row.id == 'c').term == 'change';

}