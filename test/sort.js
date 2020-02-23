async function test () {

    let data = await sample('orders');

    let results = 
        $$({ o: data.orders })
        .sort((o,o2) => 
            o.customer > o2.customer ? 1
            : o.customer < o2.customer ? -1  
            : o.rating > o2.rating ? -1 
            : o.rating < o2.rating ? 1
            : 0
        )
        .get(o => o);

    for(let i = 1; i < results.length; i++) {

        let [prv, nxt] = [ results[i-1], results[i] ];

        if (prv.customer > nxt.customer)
            return false;

        if (prv.customer == nxt.customer && prv.rating < nxt.rating)
            return false;

    }

    return true;

}