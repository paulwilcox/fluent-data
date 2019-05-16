var http = require('http');
var fs = require('fs');
var path = require('path');

http.createServer(function (request, response) {

    console.log('request ', request.url);

    let filePath =
        request.url == '/' 
        ? './example/server/index.html'
        : '.' + request.url;
    
    let ex = path.extname(filePath);

    let contentType = 
          ex == '.html' ? 'text/html'
        : ex == '.js' ? 'text/javascript'
        : 'application/octet-stream';
    
    fs.readFile(filePath, function(error, content) {
        if (error) {
            response.writeHead(500);
            response.end('error');
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(8081);

console.log('Server running at http://127.0.0.1:8081/');