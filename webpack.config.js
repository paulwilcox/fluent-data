let path = require('path');

module.exports = {
    entry: { 
        lish: './src/lish.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: `[name].next.js` 
    },
    watch: false,
    mode: 'production',
    node: {
        fs: 'empty' // fixes a bug during webpack build
    }
}

/*
// max version found in 'dist' folder
let distVersion = 
    fs
    .readdirSync('./dist')
    .map(fileName => 
        fileName
        .match(/\d+\.\d+\.\d+/)
        .reduce((a,b) => a)
    )
    .reduce((a,b) => a);

let versionLabel = pjVersion == distVersion ? 'next' : pjVersion;

module.exports = {
    entry: { 
        lish: './src/lish.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: `[name].${versionLabel}.js` 
    },
    watch: false,
    mode: 'production',
    node: {
        fs: 'empty' // fixes a bug during webpack build
    }
}
*/