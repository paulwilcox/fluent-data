let http = require('http');
let fs = require('fs');
let sampleMongo = require('./dist/sampleFDB.mongo.js');
let getJson = require('./example/server.getJson.js');

/* 
    TODO:

    Sample Data:
        
        Change sampleFDB... to sampleData..., though databases will still be called sampleFDB
        Output sampleData.server.js, but sampleData.mongo.js will still be independent of that file (after build)
        Give option for sampleData.mongo.js and IDB of sampleData.client.js to accept user passed sample data,
            but to default to sample data if none passed.
        Connsider seperating sampleData.IDB.js from sampleData.client.js
        When all this is done, then of course update the documentation.  Probably giving a specific
            section on working with sample data.

    Example Folder:
    
        Consider taking it out of gitignore, but then having a folder inside it this is part of gitignore

    Lisencing:

        Have license text output in FluentDB... files after bundling.

*/

module.exports = http.createServer((request, response) => {

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
            sampleMongo('mongodb://localhost:27017/sampleFDB', true);
            response.writeHead(200, { 'Content-type': 'text/plain' });
            response.end('sampleFDB in MongoDB has been reset to its original state.');
            break;

        case '/getJson':
            response.writeHead(200, { 'Content-Type': 'application/json' });
            getJson()
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