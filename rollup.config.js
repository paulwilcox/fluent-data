import nodeResolve from 'rollup-plugin-node-resolve';
import commonJs from 'rollup-plugin-commonjs';

export default [{
    input: 'src/FluentDB.server.js',
    output: {
        file: 'dist/FluentDB.server.next.js',
        format: 'cjs'
    }
}, {
    input: 'src/FluentDB.js',
    output: {
        file: 'dist/FluentDB.client.next.js',
        format: 'esm'
    }
}, {
    input: 'src/samples/FluentDB.sample.client.js',
    output: {
        file: 'dist/FluentDB.sample.client.js',
        format: 'esm'
    },
    plugins: [nodeResolve({ jsnext: true }), commonJs({ include: 'node_modules/**' })],    
}, {
    input: 'src/samples/FluentDB.sample.core.js',
    output: {
        file: 'dist/FluentDB.sample.server.js',
        format: 'cjs'
    }
}, {
    input: 'src/samples/FluentDB.sampleMongo.js',
    output: {
        file: 'dist/FluentDB.sampleMongo.js',
        format: 'cjs'
    }
}];

