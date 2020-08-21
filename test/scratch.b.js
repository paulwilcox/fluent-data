async function test () {

    let data = await sample('orders');

    let results = 
        $$(data.orders)
        .reduce({
            first: $$.first(p => p.customer),
            last: $$.last(p => p.customer),
            sum: $$.sum(p => p.rating),
            count: $$.count(p => p.rating),
            avg: $$.avg(p => p.rating),
            mad: $$.mad(p => p.rating),
            cor: $$.cor(p => [p.speed, p.rating]),
            corFull: $$.cor(p => [p.speed, p.rating], { tails: 1 })
        })
        .get();
        
    console.log(results);

    return true;

}