
async function test () {

    let data = await sample();

    let results = 
        $$({ o: data.orders })
        .group(o => o.customer)
        .group(o => o.rating >= 10) 
        //.get(o => o);

    console.log(Array.from(results.datasets['o'].data));

    return true;

}