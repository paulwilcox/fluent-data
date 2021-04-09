import * as g from '../src/general.js';

async function test() {

    let multiline = `this is more \r\n than one line`;

    let data = [
        { customerId: 'b', books: 4, ml: multiline },
        { customerId: 'a', books: 1, ml: multiline },
        { customerId: 'a', books: 1, ml: multiline },
        { customerId: 'b', books: 2, ml: multiline }
    ];

    let result = g.tableToString(data, x => x, 50, false).replace(/\r\n/g, '<br/>').replace(/\s/g, '&nbsp;');

    document.body.innerHTML += `<div style='font-family:consolas'>${result}</div>`


}
