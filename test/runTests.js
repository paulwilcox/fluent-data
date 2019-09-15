let puppeteer = require('puppeteer');
let server = require('../server.js');
let sTests = require('../test/tests.server.js');
let sample = require('../dist/sampleData.server.js');
let $$ = require('../dist/FluentDB.server.next.js');
require('console.table');

(async () => {

    let headless = true;
    let browser = await puppeteer.launch({headless: headless});
    let page = await browser.newPage();
    let results = [];
    let closed = false;

    let mongoTests = sTests('mongo', () => 
        $$({ 
            sam: $$.mongo('mongodb://localhost:27017/sampleData'),
            o: sam => 'orders',
            p: sam => 'products',
            c: sam => 'customers',
            pc: sam => 'potentialCustomers',
            s: sam => 'shoplifters'
        })
    );    

    let hybridLeft = sTests('mongoHybridLeft', () => 
        $$({
            sam: $$.mongo('mongodb://localhost:27017/sampleData'),
            o: sample.orders,
            p: sam => 'products',
            c: sample.customers,
            pc: sam => 'potentialCustomers',
            s: sam => 'shoplifters'  
        })
    );

    let hybridRight = sTests('mongoHybridRight', () => 
        $$({
            sam: $$.mongo('mongodb://localhost:27017/sampleData'),
            o: sam => 'orders',
            p: sample.products,
            c: sam => 'customers',
            pc: sample.potentialCustomers,
            s: sample.shoplifters
        })
    );

    await Promise.all([mongoTests, hybridLeft, hybridRight])
    .then(seri => {
        for(let series of seri)
        for(let test of series)
            results.push({
                test_name: `${test.seriesName}.${test.name}`,
                status: test.passStatus ? 'pass' : 'fail'
            });
    });

    let close = () => {
        if (closed)
            return;
        browser.close();
        console.log('headless browser closed');
        server.close();
        console.log('server closed');
        closed = true;
    }

    page.on('console', msg => {
        let logs = msg.text().split(' ');
        if (logs[0] == 'done:client.tests') {
            close();
            console.log('\nRESULTS: client.tests:\n');
            console.table(results);
            console.log();
        }
        else if (logs[0] == 'test')
            results.push({
                test_name: logs[1], 
                status: logs[2] === 'true' ? 'pass' : 'fail'
            });  
        else
            console.log(msg.text());
    });

    page.on('pageerror', err => {
        console.log(err);
        close();
    });

    await page.goto('http://127.0.0.1:8081/runClientTests');

})();



