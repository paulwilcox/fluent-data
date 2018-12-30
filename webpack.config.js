let path = require('path');

module.exports = {
    entry: { 
        lish: './src/lish.js',
        example: './example/server.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js'
    },
    watch: true,
    mode: 'production',
    node: {
        fs: 'empty' // fixes a bug
    }
}