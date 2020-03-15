import license from 'rollup-plugin-license';

// Run license() here, not in the objects of the exported 
// array.  Otherwise, the third party licence file gets 
// overwritten, not appended to.
let licensePlugin = license({
    banner: { content: { file: 'license.md' } },
    thirdParty: {
        output: 'license-3rd-party',
        includePrivate: true
    }
});

export default [{
    input: 'src/FluentDB.js',
    output: {
        file: 'dist/FluentDB.server.js',
        format: 'cjs'
    },
    plugins: licensePlugin
}, {
    input: 'src/FluentDB.js',
    output: {
        file: 'dist/FluentDB.client.js',
        format: 'esm'
    },
    plugins: licensePlugin
}];

