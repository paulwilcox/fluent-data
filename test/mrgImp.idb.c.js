async function test () {

    let idb = await sampleIdb('SampleDB', true, true); // resets it
    let data = await sample('orders');

console.log({idb})

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