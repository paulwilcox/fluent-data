
await sampleMongo('mongodb://localhost:27017/SampleDB', true, true);

let results = await 
    $$({
        c: $$.mongo('customers', 'mongodb://localhost:27017/SampleDB'),
        o: sample.orders
    })
    .catch(err => err)
    .merge((c,o) => c.id == o.customer, 'both left')
    .import(c => c)
    .execute(c => c);

return results.length == 11;


