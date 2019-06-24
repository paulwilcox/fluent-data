var http = require('http');
var fs = require('fs');
var scratch = require('./example/server.scratch.js');

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

    else if (request.url.startsWith('/src/visualizer')) {
        let cType;
        if (request.url.endsWith('.css')) cType = 'text/css';
        if (request.url.endsWith('.js')) cType = 'text/javascript';
        response.writeHead(200, { 'Content-Type': cType });
        response.end( fs.readFileSync('.' + request.url) );
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
    
}).listen(8081);

console.log('Server running at http://127.0.0.1:8081/');