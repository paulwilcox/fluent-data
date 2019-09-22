let puppeteer = require('puppeteer');
let server = require('../server.js');
let getServerResults = require('./runServerTests.js');
require('console.table');

(async () => {

    let headless = true;
    let browser = await puppeteer.launch({headless: headless});
    let page = await browser.newPage();
    let closed = false;
    let results = [];

    let close = () => {
        if (closed)
            return;
        browser.close();
        console.log('headless browser closed');
        server.close();
        console.log('server closed');
        closed = true;
    }

    page.on('console', async msg => {
        let logs = msg.text().split(' ');
        if (logs[0] == 'done:client.tests') {
            close();
            let serverResults = await getServerResults();
            results.push(...serverResults);             
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



