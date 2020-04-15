
async function test () {

    let data = await sample();

    let results = 
        $$({ o: data.orders })
        .group(o => o.customer) 
        .get(o => o);

    //console.log(results.datasets['p']);

    return true;

}