async function test () {

    await sampleMongo('mongodb://localhost:27017/SampleDB', true, true);
    let data = await sample('orders');
    let connector = $$.mongo('customers', 'mongodb://localhost:27017/SampleDB'); 

    let results = 
        $$({
            c: await connector.import(c => c),
            o: data.orders
        })
        .merge((c,o) => c.id == o.customer, 'both left')
        .get(c => c);

console.log(results);

    return results.length == 11;

}