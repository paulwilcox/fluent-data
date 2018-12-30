// DON'T USE THIS SERVER IN PRODUCTION.  It is just a 
// bare bones serer to test out lish.

let http = require('http') 
let fs = require('fs');

let requestHandler = (request, response) => {
  
    let fileName = 
        request.url == '/' 
        ? 'example/index.html' 
        : request.url.replace(/\//, '');

    let mime = 
        fileName.endsWith('.js') ? 'text/javascript'
        : fileName.endsWith('.html') ? 'html'
        : 'text';

    if (fileName == 'favicon.ico') {
        response.writeHead(204);
        response.end("");
        return;
    }

    let contents;

    try {
        contents = fs.readFileSync(fileName);
    }
    catch (er) {
        contents = `Error`;
        console.log({
            fileName, 
            error: er
        });
    }

    response.writeHead(200, {'Content-Type': mime});
    response.end(contents);

}

let port = 3000;

http
.createServer(requestHandler)
.listen(port, (err) => {

    if (err) {
        console.log('something bad happened', err);
        return;
    }

    console.log('Server running at:', port);

});