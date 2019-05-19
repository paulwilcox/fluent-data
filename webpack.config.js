let path = require('path');

module.exports = [
    {
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
    },
    {
        entry: { 
            scratch: './example/server/scratch.js'
        },
        output: {
            path: path.resolve(__dirname, 'example/server'),
            filename: `[name].transpiled.js` 
        },
        watch: true,
        mode: 'production',
        node: {
            fs: 'empty' // fixes a bug during webpack build
        },
        module: {
            rules: [{
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {presets: ['@babel/preset-env']}
                }
            }]
        }
    }
]
