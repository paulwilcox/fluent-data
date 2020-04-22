async function test () {

    let data = await sample('orders');

    let results = 
        $$({ o: data.orders })
        .sort(o => [o.customer, -o.rating])
        .get(o => o);

    check(results, 'Array version direct');

    results = 
        $$({ o: data.orders })
        .map(o => o)
        .sort(o => [o.customer, -o.rating])
        .get(o => o);

    check(results, 'Array version after Map');

    results = 
        $$({ o: data.orders })
        .sort((o,o2) => 
            o.customer > o2.customer ? 1
            : o.customer < o2.customer ? -1  
            : o.rating > o2.rating ? -1 
            : o.rating < o2.rating ? 1
            : 0
        )
        .get(o => o);

    check(results, 'boolean version direct');

    results = 
        $$({ o: data.orders })
        .map(o => o)
        .sort((o,o2) => 
            o.customer > o2.customer ? 1
            : o.customer < o2.customer ? -1  
            : o.rating > o2.rating ? -1 
            : o.rating < o2.rating ? 1
            : 0
        )
        .get(o => o);

    check(results, 'boolean version after Map');

    return true;

}

function check(results, testType) {

    for(let i = 1; i < results.length; i++) {

        let [prv, nxt] = [ results[i-1], results[i] ];

        if (prv.customer > nxt.customer)
            throw `${testType}: customers are not in ascending order.`;

        if (prv.customer == nxt.customer && prv.rating < nxt.rating)
            throw `${testType}: ratings are not in descending ` +
                'order partitioned by customer';

    }    

}