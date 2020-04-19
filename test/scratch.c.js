async function test () {

    let data = await sample();

    

    let results = 
        $$({
            o: data.orders,
            c: data.customers
        })
        .group(o => o.customer)
        .map(c => ({...c, customer: c.id, id: undefined}))
        .merge(
            (o,c) => o.customer = c.customer,
            'both both'
        )
        .get(o => o);

    console.log(results)

}

