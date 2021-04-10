import * as g from '../src/general.js';

async function test() {

    let multiline = `this is more \r\n than one line`;

    let data = [
        { customerId: 'b', books: 4, ml: multiline },
        { customerId: 'a', books: 1, ml: multiline },
        { customerId: 'a', books: 1, ml: multiline },
        { customerId: 'b', books: 2, ml: multiline }
    ];

    document.body.innerHTML += `<div id='printer' style='font-family:consolas'></div>`;

    $$(data).log() //.log('#printer');

    $$(data).group(row => row.customerId).group(row => row.books).log('#printer');


}
