let sample = require('../node_modules/sampledb/dist/SampleDB.server.js');
let sampleMongo = require('../node_modules/sampledb/dist/SampleDB.mongo.js');
let $$ = require('../dist/FluentDB.server.js');

let results = [];

module.exports = async function () {

    await test('server.filter', () => 
        fdb()
            .filter(o => o.customer == 2)
            .execute(o => o),
        ds => 
            ds.filter(x => x.customer == 2).length > 0 && 
            ds.filter(x => x.customer != 2).length == 0
    );

    await test('server.map', () => 
        fdb()
            .map(o => ({
                customer: o.customer,
                rating: o.rating,
                flag: o.rating < 10 ? 'bad' : o.rating < 50 ? 'okay' : 'good'
            }))
            .execute(o => o),
        ds =>
            Object.keys(ds[0]).includes('customer') && 
            !Object.keys(ds[0]).includes('id')
    );

    await test('server.sort', () => 
        fdb()
            .sort((o,o2) => 
                o.customer > o2.customer ? 1
                : o.customer < o2.customer ? -1  
                : o.rating > o2.rating ? -1 
                : o.rating < o2.rating ? 1
                : 0
            )
            .execute(o => o),
        ds => {
            for(let i = 1; i < ds.length; i++) {
                let [prv, nxt] = [ ds[i-1], ds[i] ];
                if (prv.customer > nxt.customer)
                    return false;
                if (prv.customer == nxt.customer && prv.rating < nxt.rating)
                    return false;
            }
            return true;
        }
    );

    await test('server.groupReduce', () => 
        fdb()
            .group(o => o.customer) 
            .reduce(o => ({
                customer: $$.first(o.customer), 
                speed: $$.avg(o.speed),
                rating: $$.avg(o.rating),
                speed_cor: $$.cor(o.speed, o.rating)
            }))
            .execute(o => o),
        ds => {
                let row0 = prop => Math.round(ds[0][prop] * 100) / 100;
                return ds.length == 3
                    && row0('rating') == 58.29
                    && row0('speed') == 4.57
                    && row0('speed_cor') == 0.74;
            }
    );

    await sampleMongo('mongodb://localhost:27017/SampleDB', true, true);

    await test('mergeImport.mongo', () => 
        $$({
                c: $$.mongo('customers', 'mongodb://localhost:27017/SampleDB'),
                o: sample.orders
            })
            .catch(err => err)
            .merge((c,o) => c.id == o.customer, 'both left')
            .import(c => c)
            .execute(c => c),
        ds => 
            ds.length == 11
    )

    return results;

}();

function fdb () { 
    return $$({ 
        c: sample.customers,
        o: sample.orders  
    });
}

async function test (
    testName,
    fdbFunc,
    tester
) { 
    let result;
    try {result = tester(await fdbFunc());} 
    catch {}
    results.push({
        test_name: testName,
        status: result ? 'pass' : 'fail' 
    });
}

