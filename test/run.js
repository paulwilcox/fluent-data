let puppeteer = require('puppeteer');
let server = require('../server.js');
let serverTestResults = require('./serverTests.js');
require('console.table');

// TODO: Allow output for when all tests pass.  Use this
// in a "tests" script in package.json

let results = [];

async function getClientResults (type, headless = true) {

    let clientUrl = `http://127.0.0.1:8081/test/${type}`
    let browser = await puppeteer.launch({headless: headless});
    let page = await browser.newPage();

    page.on('pageerror', async err => {

        results.push({
            test_name: '_browserError',
            status: 'fail'
        });

        await browser.close();
        console.log(
            'Error from browser when running tests: ', 
            err.name, 
            err.message, 
            err.stack
        );    
        return;

    })

    await page.goto(clientUrl);
    await page.waitForSelector('#results');
    
    let clientResults = await page.evaluate(() => 
        document.querySelector('#results').innerHTML
    );

    for (let clientResult of clientResults.split(';')) {
        if (clientResult == '')
            continue;
        let parts = clientResult.split(':');
        results.push({
            test_name: parts[0],
            status: parts[1]
        });
    }

    await browser.close();

}

(async () => {

    await getClientResults('clienttests');
    results.push(...serverTestResults);    
    server.close(() => console.log('server closed'));

    // sort results and remove duplicate browser errors
    results.sort((a,b) => a.test_name > b.test_name ? 1 : a.test_name < b.test_name ? -1 : 0);
    let browserErrors = results.filter(r => r.test_name == '_browserError').length;
    if (browserErrors > 0)
        results = results.slice(browserErrors - 1);

    console.log();
    console.table(results); 
    process.exit(0);    

})();
