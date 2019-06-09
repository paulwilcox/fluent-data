export default [{
    input: 'src/oneQuery.server.js',
    output: {
        file: 'dist/oneQuery.server.next.js',
        format: 'cjs'
    }
}, {
    input: 'src/oneQuery.js',
    output: {
        file: 'dist/oneQuery.client.next.js',
        format: 'esm'
    }
}, {
    input: 'example/sampleDataSets.js',
    output: {
        file: 'example/sampleDatasetsCjs.js',
        format: 'cjs'
    }
}];

