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
    // This one just moves the file
    input: 'src/samples/sampleData.client.js',
    output: {
        file: 'dist/sampleData.client.js',
        format: 'esm'
    }
}, {
    input: 'src/samples/sampleData.client.js',
    output: {
        file: 'src/samples/sampleData.server.js',
        format: 'cjs'
    }
}, {
    input: 'src/samples/sampleData.client.js',
    output: {
        file: 'dist/sampleData.server.js',
        format: 'cjs'
    }
}, {
    input: 'src/samples/sampleData.idb.js',
    output: {
        file: 'dist/sampleData.idb.js',
        format: 'esm'
    },
    plugins: [nodeResolve({ jsnext: true }), commonJs({ include: 'node_modules/**' })],    
}, {
    input: 'src/samples/sampleData.mongo.js',
    output: {
        file: 'dist/sampleData.mongo.js',
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

