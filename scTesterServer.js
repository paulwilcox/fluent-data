const npmRoot = 
    require('child_process')
    .execSync('npm root -g')
    .toString()
    .trim();

let scRequire = package => 
    require(npmRoot + '/sctester/node_modules/' + package);

scRequire('console.table');
let chalk = scRequire('chalk');
let http = require('http');
let fs = require('fs');
let puppeteer = scRequire('puppeteer'); 
let { performance } = require('perf_hooks');
let $$ = require('./dist/FluentDB.server.js');
let sampleServer = require('./node_modules/sampledb/dist/SampleDB.server.js');
let sampleMongo = require('./node_modules/sampledb/dist/SampleDB.mongo.js');

var sample = stores => 
    sampleServer('./test/_SampleDB.json', stores)
    .data;

let testDirectory = './test';
let port = 8083; 

(async () => {

    console.log();
    console.log(chalk.bgBlue('Starting SCTester:'));
    console.log();

    let server = startServer();
    let results = [];
    let errors = [];

    for (let file of fs.readdirSync(testDirectory)) {

        let fileFull = `${testDirectory}/${file}`;

        if (file.startsWith('_') || !file.endsWith('.js'))
            continue;        

        for (let location of ['client', 'server']) {

            let result = {
                testName: file.replace(/(\.c|\.s)*\.js/, ''),
                location
            };

            try {
                
                let contents = fs.readFileSync(fileFull, 'utf8');

                if (location == 'server') {

                    if (file.endsWith('.c.js'))
                        continue;

                    eval(contents);
                    
                    let t0 = performance.now();
                    result.success = (await test()) === true;
                    result.time = performance.now() - t0;

                }

                if (location == 'client') {
                    if (file.endsWith('.s.js'))
                        continue;
                    let response = await makeClientRequest(fileFull);
                    result.success = response.split(';')[0] === 'true';
                    result.time = response.split(';')[1];
                }

                result.time = msToTime(result.time);                

            }
            catch (err) {
                result.success = `err:${errors.length}`;
                errors.push(err);
            }

            results.push(result);
            
        }
    }

    server.close();

    for(let e = 0; e < errors.length; e++) {
        console.log(chalk.red(`ERROR ${e}:`));
        console.log(errors[e]);
    }

    // friendlier formats and headers
    for(let result of results) {
        if (result.time === undefined)
            result.time = '';
        result['hh:mm:ss.f'] = result.time;
        delete result.time;
        result.success = 
            result.success === true
            ? chalk.greenBright(result.success)
            : chalk.red(result.success); 
    }
    
    console.log();
    console.log(chalk.blue.underline(`SCTester-Results:`))
    console.table(results);
    console.log();

    process.exit(results.some(res => !res.success) ? 1 : 0);

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

    page.on('requestfailed', async request => {
        console.log({
            requestUrl: request.url(), 
            requestError: request.failure().errorText
        });
        pageErrored = true;
        await browser.close();
    });

    await page.goto(`http://127.0.0.1:${port}/${fileName}`);

    // FIX: This never hits because the events in 
    // question occur after this line reads. 
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
    
    console.log(`server starting on ${port}`);

    return http.createServer(async (request, response) => {

        let file = `.${request.url}`;

        let cType =
            file.endsWith('.css') ? 'text/css'
            : file.endsWith('.js') ? 'text/javascript'
            : file.endsWith('.html') ? 'text/html'
            : file.endsWith('.json') ? 'text/json'
            : null;

        if (cType == null) {
            response.writeHead(204);
            response.end();
        }

        let content;

        try {
            content = fs.readFileSync(file)
            .toString(); 
        }
        catch (error) {
            response.writeHead(500);
            response.end(error.message);
        }

        if (file.startsWith(testDirectory) && file.endsWith('.js')) {

            cType = 'text/html';
            content = `
    
                <body>
                <script type = 'module'>
            
                    import $$ from '../dist/FluentDB.client.js';
import sampleClient from '../node_modules/sampledb/dist/SampleDB.client.js';
import sampleIdb from '../node_modules/sampledb/dist/SampleDB.idb.js';

async function sample (stores) { 
    let s = await sampleClient('./_SampleDB.json', stores);
    return s.data;
}


                    ${content}   

                    let div = document.createElement('div');
                    div.id = 'results'; 

                    let t0 = performance.now();

                    Promise.resolve(test())
                    .then(res => { div.innerHTML = res; })
                    .then(() => 
                        div.innerHTML += ';' + (performance.now() - t0)
                    )
                    .finally(() => document.body.appendChild(div));

                </script>
                </body> 
    
            `;

        }

        response.writeHead(200, { 'Content-Type': cType });
        response.end(content, 'utf-8');

    })
    .listen(port);

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