let pjVersion = require('../package.json').version;
let fs = require('fs');

fs.copyFile(
    './dist/oneQuery.next.js', 
    `./dist/oneQuery.${pjVersion}.js`, 
    err => {
        if (err) throw err;
        console.log(`created oneQuery.${pjVersion}.js from oneQuery.next.js`);
    }
)

