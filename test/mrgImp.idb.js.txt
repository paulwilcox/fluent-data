
await sampleIdb('SampleDB', true, true);

let results = await
    $$({
        o: sample.orders,
        c: $$.idb('customers', 'SampleDB')
    })
    .catch(err => err)
    .merge((c,o) => c.id == o.customer, 'both left')
    .import(c => c)
    .execute(c => c);

return results.length == 11;
