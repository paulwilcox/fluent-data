async function test () {

    let idb = await sampleIdb('customers'); 
    let data = await sample('orders');
    let idbConnector = $$.idb('customers', 'SampleDB'); 

    let results = 
        $$({
            o: data.orders,
            c: await idbConnector.import(c => c)
        })
        .merge((c,o) => c.id == o.customer, 'both left')
        .get(c => c);

    return results.length == 11;
    
}