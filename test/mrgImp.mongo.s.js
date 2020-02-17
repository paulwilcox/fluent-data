async function test () {

    await sampleMongo('mongodb://localhost:27017/SampleDB', true, true);
    let data = await sample('orders');

    let results = await 
        $$({
            c: $$.mongo('customers', 'mongodb://localhost:27017/SampleDB'),
            o: data.orders
        })
        .catch(err => err)
        .merge((c,o) => c.id == o.customer, 'both left')
        .import(c => c)
        .execute(c => c);

    return results.length == 11;

}