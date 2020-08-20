async function test () {

    let data = await sample('orders');

    let results = 
        $$(data.orders)
        .reduce(o => ({
            firstCustomer: $$.first(o.customer), 
            speed: $$.avg(o.speed),
            rating: $$.avg(o.rating),
            speed_cor: $$.cor(o.speed, o.rating),
            n: $$.count(o.id)
        }))
        .get();

    console.log(results);

    return true;

}