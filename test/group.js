import { print } from '../node_modules/glimp/dist/glimp.js';

async function test () {

    let data = await sample('orders');

    let results = 
        $$({ o: data.orders })
        .group(o => o.customer) 
        .get(o => o);

    if (results.length != 3)
        return false;

    results = 
        $$({ o: data.orders })
        .group(o => o.customer)
        .group(o => o.rating >= 10) 
        .get(o => o);

    if (results.length != 3)
        return false;

    for(let entry of results) {
        if (!Array.isArray(entry))
            return false;
    }

    results = 
        $$({ o: data.orders })
        .group(o => o.customer)
        .group(o => o.rating >= 10)
        .ungroup(o => o)
        //.map(o => ({ c: o.customer, p: o.product })) 
        .get(o => o);    

    document.body.innerHTML += `<div id='results'></div><br/>`
    print('#results', results, 'results');

    return true;

}