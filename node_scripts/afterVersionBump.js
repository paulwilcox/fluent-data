let pjVersion = require('../package.json').version;
let fs = require('fs');

for (let fileType of ['client','server'])

    fs.copyFile(
        `./dist/fluentDb.${fileType}.next.js`, 
        `./dist/fluentDb.${fileType}.${pjVersion}.js`, 
        err => {
            if (err) throw err;
            console.log(`created fluentDb.${fileType}.${pjVersion}.js from fluentDb.${fileType}.next.js`);
        }
    );

