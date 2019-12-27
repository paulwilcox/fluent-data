let sample = require('../node_modules/sampledb/dist/SampleDB.server.js');
let $$ = require('../dist/FluentDB.server.js');

module.exports = async function () {

    return $$({
            c: $$.mongo('customers', 'mongodb://localhost:27017/SampleDB'),
            o: sample.orders
        })
        //.merge((c,o) => c.id == o.customer, 'both left')
        .import(c => c)
        .execute(c => c)
        .then(res => JSON.stringify(res));

}
