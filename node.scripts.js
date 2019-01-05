let pjVersion = require('./package.json').version;
let fs = require('fs');

module.exports = {

    version:

        fs.copyFile(
            './dist/lish.next.js', 
            `./dist/lish.${pjVersion}.js`, 
            err => {
                if (err) throw err;
                console.log('source.txt was copied to destination.txt');
            }
        )

};