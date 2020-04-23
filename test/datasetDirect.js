async function test () {

    let data = await sample('orders');

    let results = 
        $$(data.orders)
        .filter(o => o.customer != 7)
        .get(o => ({
            customer: o.customer,
            rating: o.rating,
            flag: o.rating < 10 ? 'bad' : o.rating < 50 ? 'okay' : 'good'
        }));

    return Object.keys(results[0]).includes('customer') 
        && !Object.keys(results[0]).includes('id')
        && !results.find(o => o.customer == 7);

}