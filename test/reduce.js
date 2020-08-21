async function test () {

    let data = await sample('orders');

    let results = 
        $$(data.orders)
        .reduce({
            firstCustomer: $$.first(o => o.customer), 
            speed: $$.avg(o => o.speed),
            rating: $$.avg(o => o.rating),
            speed_cor: $$.cor(o => [o.speed, o.rating]),
            n: $$.count(o => o.id)
        })
        .get();

    if(results.n != 12) throw `
        results.n does not equal 12
    `;

    results = 
        $$(data.orders)
        .reduce({
            firstCustomer: $$.first(o => o.customer), 
            speed: $$.avg(o => o.speed),
            rating: $$.avg(o => o.rating),
            speed_cor: $$.cor(o => [o.speed, o.rating], { tails: 1 }),
            n: $$.count(o => o.id)
        })
        .get();

    if($$.round(results.speed_cor.pVal, 5) !=  0.01843) throw `
        results.n does not round to 0.01843
    `;

    results = 
        $$(data.orders)
        .group(o => o.customer) 
        .reduce({
            customer: $$.first(o => o.customer), 
            speed: $$.avg(o => o.speed),
            rating: $$.avg(o => o.rating),
            speed_cor: $$.cor(o => [o.speed, o.rating])
        })
        .get();

    let row0 = prop => Math.round(results[0][prop] * 100) / 100;

    return results.length == 3
        && row0('rating') == 58.29
        && row0('speed') == 4.57
        && row0('speed_cor') == 0.74;

}