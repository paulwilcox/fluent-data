import nodeResolve from 'rollup-plugin-node-resolve';
import commonJs from 'rollup-plugin-commonjs';
import license from 'rollup-plugin-license';

// Run license() here, not in the objects of the exported 
// array.  Otherwise, the third party licence file gets 
// overwritten, not appended to.
let licensePlugin = license({
    banner: { content: { file: 'license' } },
    thirdParty: {
        output: 'license-3rd-party',
        includePrivate: true
    }
});

export default [{
    input: 'src/FluentDB.server.js',
    output: {
        file: 'dist/FluentDB.server.next.js',
        format: 'cjs'
    },
    plugins: licensePlugin
}, {
    input: 'src/FluentDB.js',
    output: {
        file: 'dist/FluentDB.client.next.js',
        format: 'esm'
    },
    plugins: licensePlugin
}, { 
    // This one just moves the file
    input: 'src/samples/sampleData.client.js',
    output: {
        file: 'dist/sampleData.client.js',
        format: 'esm'
    },
    plugins: licensePlugin
}, {
    input: 'src/samples/sampleData.client.js',
    output: {
        file: 'src/samples/sampleData.server.js',
        format: 'cjs'
    },
    plugins: licensePlugin
}, {
    input: 'src/samples/sampleData.client.js',
    output: {
        file: 'dist/sampleData.server.js',
        format: 'cjs'
    },
    plugins: licensePlugin
}, {
    input: 'src/samples/sampleData.idb.js',
    output: {
        file: 'dist/sampleData.idb.js',
        format: 'esm'
    },
    plugins: [
        nodeResolve({ jsnext: true }), 
        commonJs({ include: 'node_modules/**' }), 
        licensePlugin
    ],    
}, {
    input: 'src/samples/sampleData.mongo.js',
    output: {
        file: 'dist/sampleData.mongo.js',
        format: 'cjs'
    },
    plugins: [commonJs(), licensePlugin]
}, {
    input: 'test/tests.js',
    output: {
        file: 'test/tests.server.js',
        format: 'cjs'
    },
    plugins: licensePlugin
}];

