import { print as prn } from '../src/visualizer/printer.js';

async function test () {

    document.body.innerHTML += `<div id='result'></div><br/>`

    $$.htmlPrinter = prn;

    let data = await sample('orders');

    let results = 
        $$({
            o: data.orders
        })
        .print(o => o, 'orders', '#result');

    return true;

}