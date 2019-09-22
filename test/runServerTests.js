let $$ = require('../dist/FluentDB.server.next.js');
let sTests = require('../test/tests.server.js');
let sample = require('../dist/sampleData.server.js');
let sampleMongo = require('../dist/sampleData.mongo.js');

module.exports = function () {

    let url = 'mongodb://localhost:27017/sampleData';

    return sampleMongo(url, true)
    .then(() => Promise.all([
    
        sTests('mongo', () => $$({ 
            sam: $$.mongo(url),
            o: sam => 'orders',
            p: sam => 'products',
            c: sam => 'customers',
            pc: sam => 'potentialCustomers',
            s: sam => 'shoplifters'
        })),    

        sTests('mongoHybridLeft', () => $$({
            sam: $$.mongo(url),
            o: sample.orders,
            p: sam => 'products',
            c: sample.customers,
            pc: sam => 'potentialCustomers',
            s: sam => 'shoplifters'  
        })),

        sTests('mongoHybridRight', () => $$({
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