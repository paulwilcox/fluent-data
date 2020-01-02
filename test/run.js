require('console.table');
let fs = require('fs');
let http = require('http');
let puppeteer = require('puppeteer');
let { performance } = require('perf_hooks');
let $$ = require('../dist/FluentDB.server.js');
let sample = require('../node_modules/sampledb/dist/SampleDB.server.js');
let sampleMongo = require('../node_modules/sampledb/dist/SampleDB.mongo.js');

(async () => {

    let server = startServer();
    let results = [];

    for (let file of fs.readdirSync('test')) {

        if (file == 'run.js')
            continue;        

        for (let location of ['client', 'server']) {

            let result = {
                testName: file.replace('.js', ''),
                location
            };

            try {

                // file will be '/test/file.js'
                let contents = fs.readFileSync(`./test/${file}`, 'utf8');

                if (location == 'server') {

                    if (contents.includes('sampleIdb'))
                        continue;

                    eval(`
                        function testFunc() {
                            ${contents}
                        }
                    `);

                    let t0 = performance.now();
                    result.success = testFunc();
                    result.time = performance.now() - t0;

                }

                if (location == 'client') {

                    if (contents.includes('sampleMongo') && location == 'client')
                        continue;

                    let response = await makeClientRequest(file);
                    result.success = response.split(';')[0];
                    result.time = response.split(';')[1];

                }

                result.time = msToTime(result.time);                

            }
            catch (err) {
                result.success = false;
                result.errorMsg = err;
            }

            results.push(result);
            
        }
    }

    server.close();

    console.table(results)

})();

async function makeClientRequest (fileName) {

    let browser = await puppeteer.launch({headless: true});
    let page = await browser.newPage();
    let pageErrored = false;

    page.on('pageerror', async err => {
        await page.content().then(pg => console.log({
            pageError: err,
            pageContents: pg
        }))
        pageErrored = true;
        await browser.close();
    });

    await page.goto(`http://127.0.0.1:8082/test/${fileName}`);

    if (pageErrored) 
        return;

    await page.waitForSelector('#results');
    
    let clientResults = await page.evaluate(() => 
        document.querySelector('#results').innerHTML
    );

    await browser.close();

    return clientResults;

}

function startServer () { 
    
    return http.createServer(async (request, response) => {

        if (!request.url.endsWith('.js')) {
            response.writeHead(204);
            response.end();
            return;
        }

        if (!request.url.startsWith('/test')) {
            response.writeHead(200, { 'Content-Type': 'text/javascript' });
            response.end(fs.readFileSync(`.${request.url}`));
            return;
        }

        // file will be '/test/file.js'
        let contents = fs.readFileSync(`.${request.url}`, 'utf8');

        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(`

            <body>
            <script type = 'module'>

                import $$ from '../dist/FluentDB.client.js';
                import sample from '../node_modules/sampledb/dist/SampleDB.client.js';
                import sampleIdb from '../node_modules/sampledb/dist/SampleDB.idb.js';
    
                function testFunc () {
                    ${contents}  
                } 

                let div = document.createElement('div');
                div.id = 'results'; 
                let t0 = performance.now();
                div.innerHTML = testFunc();
                div.innerHTML += ';' + (performance.now() - t0);
                document.body.appendChild(div);

            </script>
            </body> 

        `, 'utf-8');

    })
    .listen(8082);

}

// dusht at stackoverflow.com/questions/19700283
// except that I don't know why he divides ms by 100
function msToTime(duration) {

    let ms = parseInt(duration % 1000);
    let sec = Math.floor((duration / 1000) % 60);
    let min = Math.floor((duration / (1000 * 60)) % 60);
    let hr = Math.floor((duration / (1000 * 60 * 60)) % 24);
  
    hr = hr < 10 ? '0' + hr : hr;
    min = min < 10 ? '0' + min : min;
    sec = sec < 10 ? '0' + sec : sec;
  
    return `${hr}:${min}:${sec}.${ms}`;

}