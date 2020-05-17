
async function test () {

    let data = await sample('orders');

    let results = 
        $$(data.orders)
        .filter(o => o.customer == 2)
        .get();

    return results.filter(x => x.customer == 2).length > 0 
        && results.filter(x => x.customer != 2).length == 0;

}