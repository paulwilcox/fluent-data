async function test () {

    let results = await merge('both both');

    return results.length == 5 
        && confirm(results, 'c', 'Confucius', 'change');

}

async function merge(mapper) {

    let data = await sample('philosophites, mathematicians');

    let results = await
        $$({
            p: data.philosophites,
            m: data.mathematicians
        })
        .merge((p,m) => p.id == m.id, mapper)
        .execute(p => p);

    return results;

}

function confirm(results, rowId, subject, term) {
    let row = results.find(row => row.id == rowId);
    return row.subject == subject 
        && row.term == term;
}