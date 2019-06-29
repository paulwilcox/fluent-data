let pjVersion = require('../package.json').version;
let fs = require('fs');

for (let fileType of ['client','server'])

    fs.copyFile(
        `./dist/FluentDB.${fileType}.next.js`, 
        `./dist/FluentDB.${fileType}.${pjVersion}.js`, 
        err => {
            if (err) throw err;
            console.log(`created FluentDB.${fileType}.${pjVersion}.js from FluentDB.${fileType}.next.js`);
        }
    );

