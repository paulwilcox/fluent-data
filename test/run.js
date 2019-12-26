let puppeteer = require('puppeteer');
let server = require('../server.js');
//let getServerResults = require('./doServer.js');
require('console.table');

// TODO: Allow output for when all tests pass.  Use this
// in a "tests" script in package.json

let results = [];

async function getClientResults (type, headless = true) {

    let clientUrl = `http://127.0.0.1:8081/test/${type}`
    let browser = await puppeteer.launch({headless: headless});
    let page = await browser.newPage();

    page.on('console', async msg => {

        if (msg.text() == 'done') {
            await browser.close();
            console.log('headless browser closed');    
            return;
        }

        if (!msg.text().startsWith('test')) {
            console.log(msg.text());
            return;
        }

        let parts = msg.text().split(' ');
        results.push({
            test_name: parts[1], 
            status: parts[2] === 'true' ? 'pass' : 'fail'
        });  
   
    });

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

}

(async () => {

    await getClientResults('tests');
//    getClientResults('doExternalIdb');
//    let serverResults = await getServerResults(seriToRun, testsToRun);
//    results.push(...serverResults);    
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
