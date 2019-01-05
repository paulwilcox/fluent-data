let path = require('path');

module.exports = {
    entry: { 
        oneQuery: './src/oneQuery.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: `[name].next.js` 
    },
    watch: true,
    mode: 'production',
    node: {
        fs: 'empty' // fixes a bug during webpack build
    }
}
