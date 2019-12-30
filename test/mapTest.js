
let results = 
    $$({
        o: sample.orders
    })
    .map(o => ({
        customer: o.customer,
        rating: o.rating,
        flag: o.rating < 10 ? 'bad' : o.rating < 50 ? 'okay' : 'good'
    }))
    .execute(o => o);

return Object.keys(results[0]).includes('customer') 
    && !Object.keys(results[0]).includes('id');

    