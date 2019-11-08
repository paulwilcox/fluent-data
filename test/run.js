let puppeteer = require('puppeteer');
let server = require('../server.js');
let getServerResults = require('./doServer.js');
require('console.table');

// TODO: Allow output for when all tests pass.  Use this
// in a "tests" script in package.json

let seriToRun = process.argv[2];
let testsToRun = process.argv[3];
let results = [];

async function getClientResults (type, headless = true) {

    let clientUrl = `http://127.0.0.1:8081/test/${type}`
    if (seriToRun) clientUrl += `&seriToRun='${seriToRun}'`;
    if (testsToRun) clientUrl += `&testsToRun='${testsToRun}'`; 
    clientUrl = clientUrl.replace('&', '?'); // replaces only first '&', which is actually what we want    

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

    await page.goto(clientUrl);

}

(async () => {

    getClientResults('doClient');
    getClientResults('doExternalIdb');
    let serverResults = await getServerResults(seriToRun, testsToRun);
    results.push(...serverResults);    
    server.close(() => console.log('server closed'));
    results.sort((a,b) => a.test_name > b.test_name ? 1 : a.test_name < b.test_name ? -1 : 0);
    console.log();
    console.table(results); 
    process.exit(0);    

})();
