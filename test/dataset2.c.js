import dataset2 from '../src/dataset2.js';

function* iterator () {
    yield 1;
    yield 2;
    yield 3;
}

function peeker(itObj) {
    let peekedObj = itObj.next();
    let rebuilt = function*() {
        if(peekedObj.done)
            return;
        yield peekedObj.value;
        yield* itObj;
    }
    return { peekedObj, rebuilt };
}

async function test () {

    let iter = iterator();
    let peeked = peeker(iter);

    console.log(peeked.peekedObj);
    for(let i of peeked.rebuilt())
        console.log(i);



    /*
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
    */
    return true;

}