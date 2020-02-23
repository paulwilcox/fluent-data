
async function test () {

    let data = await sample('customers, orders');

    let results = 
        $$({ 
            c: data.customers,
            o: data.orders  
        })
        .filter(o => o.customer == 2)
        .get(o => o);

    return results.filter(x => x.customer == 2).length > 0 
        && results.filter(x => x.customer != 2).length == 0;

}