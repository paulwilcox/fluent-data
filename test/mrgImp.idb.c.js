async function test () {

    let idb = await sampleIdb('customers'); 
    let data = await sample('orders');

    let results = await
        $$({
            o: data.orders,
            c: $$.idb('customers', 'SampleDB')
        })
        .merge((c,o) => c.id == o.customer, 'both left')
        .import(c => c)
        .execute(c => c);

    return results.length == 11;
    
}