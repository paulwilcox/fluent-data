let http = require('http');
let fs = require('fs');
let getJson = require('./example/server.getJson.js');

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