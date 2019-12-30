let fs = require('fs');

for (let file of fs.readdirSync('test')) {

    if (['clientTests.js', 'serverTests.js', 'run.js', 'run2.js', 'run3.js'].includes(file))
        continue;

    let contents = fs.readFileSync(`test/${file}`, 'utf8');
    let testName = file.replace('.js', '');
    let isIdbTest = contents.includes('sampleIdb.');
    let isMongoTest = contents.includes('sampleMongo.');
    let isServer = true;
    
    eval(`
        function testFunc () {
            ${importsString(contents, isServer)}
            ${contents}  
        }  
    `)
    
    let result = {testName};
    
    try {result.success = testFunc();}
    catch (err) {
        result.success = false;
        result.errorMsg = err;
    }
    
    console.log({
        testName,
        result
    });

}

function importsString (
    contents,
    isServer
) {

    let imports = '';
    let sampleDist = '../node_modules/sampledb/dist';

    if (isServer) imports += `
            let $$ = require('../dist/FluentDB.server.js');
            let sample = require('${sampleDist}/SampleDB.server.js');
        `;
    else imports += `
            import $$ from '../dist/FluentDB.client.js';
            import sample from '${sampleDist}/SampleDB.client.js';
        `;                

    if (contents.includes('sampleIdb.')) imports += 
        `import sampleIdb from '${sampleDist}/SampleDB.idb.js';`;
    
    if (contents.includes('sampleMongo.')) imports += 
        `let sampleMongo = require('${sampleDist}/SampleDB.mongo.js');`;

    return imports;

}