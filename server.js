let http = require('http');
let fs = require('fs');
let sampleMongo = require('./dist/sampleData.mongo.js');
let getMongo = require('./example/server.getMongo.js');

module.exports = http.createServer(async (request, response) => {

    console.log('request: ', request.url);

    switch (request.url) {

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

        case '/resetMongo':
            await sampleMongo('mongodb://localhost:27017/sampleData', true);
            response.writeHead(200, { 'Content-type': 'text/plain' });
            response.end('sampleData in MongoDB has been reset to its original state.');
            break;

        case '/resetMongoCustom':
            let data = { 
                table1: [{ a: 'ay', b: 'bee' }, { a: 'eigh', b: 'bea' }],
                table2: [{ x: 'ex', y: 'why' }, { x: 'ecks', y: 'ooaye' }]
            };
            await sampleMongo('mongodb://localhost:27017/sampleData', data);
            response.writeHead(200, { 'Content-type': 'text/plain' });
            response.end('sampleData in MongoDB has been reset with custom data.');
            break;

        case '/getMongo':
            response.writeHead(200, { 'Content-Type': 'application/json' });
            getMongo()
                .then(json => response.end(json))
                .catch(e => console.log(e));
            break;


        case '/runClientTests':

            fs.readFile('./test/runClientTests.html', function(error, content) {
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

        case '/favicon.ico':
            response.writeHead(204);
            response.end();
            break;
    
        default:

            let cType =
                request.url.endsWith('.css') ? 'text/css'
                : request.url.endsWith('.js') ? 'text/javascript'
                : request.url.endsWith('.html') ? 'text/html'
                : null;

            fs.readFile('.' + request.url, function(error, content) {
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