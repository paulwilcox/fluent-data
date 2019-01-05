let pjVersion = require('../package.json').version;
let fs = require('fs');

fs.copyFile(
    './dist/lish.next.js', 
    `./dist/lish.${pjVersion}.js`, 
    err => {
        if (err) throw err;
        console.log(`created lish.${pjVersion}.js from lish.next.js`);
    }
)

