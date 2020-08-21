async function test () {

    let data = await sample('orders');

    let results = 
        $$(data.orders)
        .reduce({
            sum: $$.sum(o => o.rating),
            n: $$.count(o => o.rating),
            avg: $$.avg(o => o.rating),
            cor: $$.cor(o => [o.speed,o.rating], { tails: 1 })
        })
        .get();

    console.log(data)

    console.log(results);

    return true;

}