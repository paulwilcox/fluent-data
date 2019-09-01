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
    input: 'src/samples/sampleFDB.core.js',
    output: {
        file: 'src/samples/sampleFDB.coreServer.js',
        format: 'cjs'
    }
}, {
    input: 'src/samples/sampleFDB.client.js',
    output: {
        file: 'dist/sampleFDB.client.js',
        format: 'esm'
    },
    plugins: [nodeResolve({ jsnext: true }), commonJs({ include: 'node_modules/**' })],    
}, {
    input: 'src/samples/sampleFDB.mongo.js',
    output: {
        file: 'dist/sampleFDB.mongo.js',
        format: 'cjs'
    },
    plugins: [commonJs()]
}, {
    input: 'test/tests.js',
    output: {
        file: 'test/tests.server.js',
        format: 'cjs'
    }
}];

