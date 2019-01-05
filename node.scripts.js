let pjVersion = require('./package.json').version;
let fs = require('fs');

process.argv.forEach(
    (val, index, array) => {
        console.log(index + ': ' + val);
    }
);

let x = {

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