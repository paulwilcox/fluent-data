let path = require('path');

module.exports = [
    {
        entry: { 
            FluentDB: './src/FluentDB.js'
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
];
