async function test () {

    let data = await sample('orders');

    let results = 
        $$(data.orders)
        .reduce2({
            sum: $$.sum2(o => o.id),
            n: $$.count2(o => o.id),
            avg: $$.avg2(o => o.id)
        })
        .get();

    console.log(data)

    console.log(results);

    return true;

}