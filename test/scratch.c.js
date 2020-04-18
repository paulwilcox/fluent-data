
async function test () {

    let data = await sample('orders');

    let results = 
        $$({ 
            o: data.orders  
        })
        .filter(o => o.customer == 2)
        .get(o => o);

    // Also implicitly testing to see if map works with
    // nested groupings as desired             
    results = 
        $$({ o: data.orders })
        .group(o => o.customer)
        .group(o => o.rating >= 10)
        .ungroup(o => o)
        .get(o => o);    


}