let $$ = require('../dist/FluentDB.server.next.js');
let sample = require('../dist/sampleData.server.js');
let _tests = require('../test/tests.server.js');
let sampleMongo = require('../dist/sampleData.mongo.js');

// TODO: I think I have to rebuild sampleMongo after every 
// series becasue 'merge' changes the state of the external
// database.
module.exports = function (seriToRun, testsToRun) {

    let tests = (testName, fdbCreator) =>
        new _tests(seriToRun, testsToRun)
        .run(testName, fdbCreator);

    let url = 'mongodb://localhost:27017/sampleData';

    return sampleMongo(url, true)
    .then(() => Promise.all([

        tests('mongo', () => $$({ 
            sam: $$.mongo(url),
            o: sam => 'orders',
            p: sam => 'products',
            c: sam => 'customers',
            pc: sam => 'potentialCustomers',
            s: sam => 'shoplifters'
        })),    

        tests('node/mongo', () => $$({
            sam: $$.mongo(url),
            o: sample.orders,
            p: sam => 'products',
            c: sample.customers,
            pc: sam => 'potentialCustomers',
            s: sam => 'shoplifters'  
        })),

        tests('mongo/node', () => $$({
            sam: $$.mongo(url),
            o: sam => 'orders',
            p: sample.products,
            c: sam => 'customers',
            pc: sample.potentialCustomers,
            s: sample.shoplifters
        }))

    ]))
    .then(seri => {

        let results = [];

        for(let series of seri)
        for(let test of series)
            results.push({
                test_name: `${test.seriesName}.${test.name}`,
                status: test.passStatus ? 'pass' : 'fail'
            });
    
        return results;    

    });

}