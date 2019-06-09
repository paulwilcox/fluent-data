let pjVersion = require('../package.json').version;
let fs = require('fs');

fs.copyFile(
    './dist/oneQuery.client.next.js', 
    `./dist/oneQuery.client.${pjVersion}.js`, 
    err => {
        if (err) throw err;
        console.log(`created oneQuery.client.${pjVersion}.js from oneQuery.client.next.js`);
    }
);

fs.copyFile(
    './dist/oneQuery.server.next.js', 
    `./dist/oneQuery.server.${pjVersion}.js`, 
    err => {
        if (err) throw err;
        console.log(`created oneQuery.server.${pjVersion}.js from oneQuery.server.next.js`);
    }
);
