let pjVersion = require('../package.json').version;
let fs = require('fs');

fs.readdirSync('./dist')
    .filter(file => 
        /FluentDB\.\w+\.\d.+\.\js$/.test(file)
    )
    .forEach(file => fs.unlinkSync(`.\\dist\\${file}`));

for (let fileType of ['client','server'])

    fs.copyFile(
        `./dist/FluentDB.${fileType}.next.js`, 
        `./dist/FluentDB.${fileType}.${pjVersion}.js`, 
        err => {
            if (err) throw err;
            console.log(`created FluentDB.${fileType}.${pjVersion}.js from FluentDB.${fileType}.next.js`);
        }
    );

