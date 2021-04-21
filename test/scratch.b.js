import dataset from '../src/dataset.js';
import grouping from '../src/grouping.js';

async function test() {
/*
    let db = await
        fetch('./_jsonSender.r.js')
        .then(resp => $$.fromJson(resp))
        .then(obj => console.log(
            'obj', obj));
*/

    let multiline = `this is more\r\nthan one line`;

    let data = [
        { customerId: 'b', books: 4, ml: multiline, sound: 'bee' },
        { customerId: 'a', books: 1, ml: multiline, sound: 'eigh' },
        { customerId: 'a', books: 5, ml: multiline, sound: 'eigh' },
        { customerId: 'b', books: 2, ml: multiline, sound: 'bee' }
    ];

    document.body.innerHTML += `<div id='printer' style='font-family:consolas'></div>`;

    let arrayified = $$(data)
        .group(row => row.customerId)
        .group(row => [row.customerId, row.sound])
        .get();

    console.log(arrayified);

    let groupified = grouping.groupify(arrayified);
    console.log(dataset.prototype.get.call(groupified));

}




