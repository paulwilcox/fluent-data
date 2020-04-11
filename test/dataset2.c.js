import dataset2 from '../src/dataset2.js';

async function test () {

    let data = await sample('orders');

    let results = 
        new dataset2(data.orders)
        .map(o => ({
            customer: o.customer,
            rating: o.rating,
            flag: o.rating < 10 ? 'bad' : o.rating < 50 ? 'okay' : 'good'
        }))
        .get();

    console.log(results);

    return true;

}