let http = require('http');
let fs = require('fs');
let sampleMongo = require('./dist/sampleData.mongo.js');
let getMongo = require('./example/server.getMongo.js');

// Note that because this isnt really supposed to be a produciton site,
// I'm (psw) taking advantage and writing it from 'scratch' just to 
// keep up a good feel for the nuts and bolts.

module.exports = http.createServer(async (request, response) => {

    console.log('request: ', request.url);
    let str = request.url.split(/\?|\&/);
    let url = str[0].toLowerCase();
    
    let params = {};
    for(let s of str.slice(1)) {
        let terms = s.split('=').map(t => decodeURIComponent(t));
        params[terms[0]] = terms[1];
    };

    let fillTemplate = content => {
        content = content.toString()
        for(let param of Object.entries(params)) 
            content = content.replace(`__${param[0]}`, param[1]);
        return content;
    }
    
    switch (url) {

        case '/':

            fs.readFile('./example/client.html', function(error, content) {
                if (error) {
                    response.writeHead(500);
                    response.end(error.message);
                }
                else {
                    response.writeHead(200, { 'Content-Type': 'text/html' });
                    response.end(content, 'utf-8');
                }
            });
    
            break;

        case '/resetmongo':
            await sampleMongo('mongodb://localhost:27017/sampleData', true);
            response.writeHead(200, { 'Content-type': 'text/plain' });
            response.end('sampleData in MongoDB has been reset to its original state.');
            break;

        case '/resetmongocustom':
            let data = { 
                table1: [{ a: 'ay', b: 'bee' }, { a: 'eigh', b: 'bea' }],
                table2: [{ x: 'ex', y: 'why' }, { x: 'ecks', y: 'ooaye' }]
            };
            await sampleMongo('mongodb://localhost:27017/sampleData', data);
            response.writeHead(200, { 'Content-type': 'text/plain' });
            response.end('sampleData in MongoDB has been reset with custom data.');
            break;

        case '/getmongo':
            response.writeHead(200, { 'Content-Type': 'application/json' });
            getMongo()
                .then(json => response.end(json))
                .catch(e => console.log(e));
            break;


        case '/runclienttests':

            fs.readFile('./test/runClientTests.html', function(error, content) {
                if (error) {
                    response.writeHead(500);
                    response.end(error.message);
                }
                else {
                    content = fillTemplate(content)
                    response.writeHead(200, { 'Content-Type': 'text/html' });
                    response.end(content, 'utf-8');
                }
            });
    
            break;

        case '/favicon.ico':
            response.writeHead(204);
            response.end();
            break;
    
        default:

            let cType =
                url.endsWith('.css') ? 'text/css'
                : url.endsWith('.js') ? 'text/javascript'
                : url.endsWith('.html') ? 'text/html'
                : null;

            fs.readFile('.' + url, function(error, content) {
                if (error) {
                    response.writeHead(500);
                    response.end(error.message);
                }
                else {
                    response.writeHead(200, { 'Content-Type': cType });
                    response.end(content, 'utf-8');
                }
            });

    }
    
})
.listen(8081);

console.log('Server running at http://127.0.0.1:8081/');