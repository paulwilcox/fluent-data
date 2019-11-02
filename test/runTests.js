let puppeteer = require('puppeteer');
let server = require('../server.js');
let getServerResults = require('./runServerTests.js');
require('console.table');

// TODO: Separate server code from puppeteer code.  
// TODO: Allow output for when all tests pass.  Use this
// in a "tests" script in package.json

let seriToRun = process.argv[2];
let testsToRun = process.argv[3];

let clientUrl = 'http://127.0.0.1:8081/runClientTests'
if (seriToRun) clientUrl += `&seriToRun='${seriToRun}'`;
if (testsToRun) clientUrl += `&testsToRun='${testsToRun}'`; 
clientUrl = clientUrl.replace('&', '?'); // replaces only first '&', which is actually what we want

(async () => {

    let headless = true;
    let browser = await puppeteer.launch({headless: headless});
    let page = await browser.newPage();
    let closed = false;
    let results = [];

    let close = async () => {
        if (closed)
            return;
        await browser.close();
        console.log('headless browser closed');
        await new Promise((res,rej) => res(server.close()));
        console.log('server closed');
        closed = true;
    }

    page.on('console', async msg => {
        let logs = msg.text().split(' ');
        if (logs[0] == 'done:client.tests') {
            await close();
            let serverResults = await getServerResults(seriToRun, testsToRun);
            results.push(...serverResults);             
            console.table(results);
            console.log();
            process.exit(0);
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

    await page.goto(clientUrl);

})();



