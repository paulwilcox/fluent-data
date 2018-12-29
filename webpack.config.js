let path = require('path');

module.exports = {
    entry: './src/lish.js',
    output: {
        path: path.resolve(__dirname, '/dist'),
        filename: '[name].bundle.js'
    }
}