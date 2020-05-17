import { print } from '../node_modules/glimp/dist/glimp.js';

async function test () {

    $$.htmlPrinter = print;
    document.body.innerHTML += `<div id='result'></div><br/>`
    let data = await sample('orders');

    let results = 
        $$({o: data.orders})
        .with(o => print('#result', o, 'orders'))
        .with(o => console.log(o));

}