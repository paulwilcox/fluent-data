let fs = require('fs');
let http = require('http');
let puppeteer = require('puppeteer');

let server = http.createServer(async (request, response) => {

    if (!request.endsWith('.js')) {
        response.writeHead(204);
        response.end();
        return;
    }

    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(`console.log('here')`, 'utf-8');

})
.listen(8081);

async function makeClientRequest (fileName) {

    let clientUrl = `http://127.0.0.1:8081/${fileName}`
    let browser = await puppeteer.launch({headless: headless});
    let page = await browser.newPage();

    page.on('pageerror', async err => {

        console.log('makeClientRequest page error');

        await browser.close();
        console.log(
            'Error from browser when running tests: ', 
            err.name, 
            err.message, 
            err.stack
        );    
        return;

    });

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
            status: parts[1] == 'true' ? 'pass' : 'fail'
        });
    }

    await browser.close();

}
