async function test () {

    let data = await sample('orders');

    let results = 
        $$({ o: data.orders })
        .group(o => o.customer) 
        .reduce(o => ({
            customer: $$.first(o.customer), 
            speed: $$.avg(o.speed),
            rating: $$.avg(o.rating),
            speed_cor: $$.cor(o.speed, o.rating)
        }))
        .execute(o => o);

    let row0 = prop => Math.round(results[0][prop] * 100) / 100;

    return results.length == 3
        && row0('rating') == 58.29
        && row0('speed') == 4.57
        && row0('speed_cor') == 0.74;

}