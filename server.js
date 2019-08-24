let http = require('http');
let fs = require('fs');
let scratch = require('./example/server.scratch.js');

http.createServer(function (request, response) {

    console.log('request ', request.url);

    if (request.url == '/favicon.ico') {
        response.writeHead(204);
        response.end();
    }

    else if (request.url == '/scratch') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        scratch.getJson().then(json => response.end(json)).catch(e => console.log(e));
    }

    else if (request.url == '/') {

        fs.readFile('./example/server.index.html', function(error, content) {
            if (error) {
                response.writeHead(500);
                response.end(error.message);
            }
            else {
                response.writeHead(200, { 'Content-Type': 'text/html' });
                response.end(content, 'utf-8');
            }
        });
    
    }

    else {

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
    
}).listen(8081);

console.log('Server running at http://127.0.0.1:8081/');