async function test () {

    let data = await sample('orders');

    let results = 
        $$({
            o: data.orders
        })
        .get(o => ({
            customer: o.customer,
            rating: o.rating,
            flag: o.rating < 10 ? 'bad' : o.rating < 50 ? 'okay' : 'good'
        }));

    return Object.keys(results[0]).includes('customer') 
        && !Object.keys(results[0]).includes('id');

}