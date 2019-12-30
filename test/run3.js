let fs = require('fs');
let http = require('http');
let puppeteer = require('puppeteer');

// TODO: Write file contents into script in a way that
// '#results' captures the return value.  Then use the
// output.

let server = http.createServer(async (request, response) => {

    if (!request.url.endsWith('.js')) {
        response.writeHead(204);
        response.end();
        return;
    }

    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(`

        <body>
        <script>
            let div = document.createElement('div');
            div.id = 'results';       
            document.body.appendChild(div); 
        </script>
        </body> 

    `, 'utf-8');

})
.listen(8082);

async function makeClientRequest (fileName) {

    let browser = await puppeteer.launch({headless: true});
    let page = await browser.newPage();
    let pageErrored = false;

    page.on('pageerror', async err => {
        console.log({pageError: err});
        pageErrored = true;
        await browser.close();
    });

    await page.goto(`http://127.0.0.1:8082/${fileName}`);

    if (pageErrored) {
        return;
    }

    await page.waitForSelector('#results');
    
    let clientResults = await page.evaluate(() => 
        document.querySelector('#results').innerHTML
    );

    await browser.close();

    return clientResults;

}

makeClientRequest('filterTest.js')
.then(x => {
    console.log({x});
})
.finally(() => server.close());

