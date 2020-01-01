let fs = require('fs');
let http = require('http');
let puppeteer = require('puppeteer');

(async () => {

    let server = startServer();
    let results = [];

    for (let file of fs.readdirSync('test')) {

        if (['clientTests.js', 'serverTests.js', 'run.js', 'run2.js', 'run3.js'].includes(file))
            continue;

        let result = {testName: file.replace('.js', '')};

        try {
            result.success = await makeClientRequest(file);
        }
        catch (err) {
            result.success = false;
            result.errorMsg = err;
        }

        results.push(result);

    }

    server.close();

    console.log({results})

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

        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(`

            <body>
            <script type = 'module'>
                ${testFuncString(request.url)}
                let div = document.createElement('div');
                div.id = 'results'; 
                div.innerHTML = testFunc();
                document.body.appendChild(div); 
            </script>
            </body> 

        `, 'utf-8');

    })
    .listen(8082);

}

function testFuncString (file, isServer) {

    // file will be '/test/file.js'
    let contents = fs.readFileSync(`.${file}`, 'utf8');

    return `
        ${importsString(contents, isServer)}
        function testFunc () {
            ${contents}  
        }  
    `;

}

function importsString (
    contents,
    isServer
) {

    let imports = '';
    let sampleDist = '../node_modules/sampledb/dist';

    if (isServer) imports += `
            let $$ = require('../dist/FluentDB.server.js');
            let sample = require('${sampleDist}/SampleDB.server.js');
        `;
    else imports += `
            import $$ from '../dist/FluentDB.client.js';
            import sample from '${sampleDist}/SampleDB.client.js';
        `;                

    if (contents.includes('sampleIdb.')) imports += 
        `import sampleIdb from '${sampleDist}/SampleDB.idb.js';`;
    
    if (contents.includes('sampleMongo.')) imports += 
        `let sampleMongo = require('${sampleDist}/SampleDB.mongo.js');`;

    return imports;

}