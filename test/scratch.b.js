async function test () {

    let data = await sample('orders, customers');

    let results = 
        $$({ 
            o: data.orders,
            c: data.customers 
        })
        .merge((o,c) => o.customer == c.id, 'stack both')
        .get('o');

    console.log(results)

}
