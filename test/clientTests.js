import sample from '../node_modules/sampledb/dist/SampleDB.client.js';
import sampleIdb from '../node_modules/sampledb/dist/SampleDB.idb.js';
import $$ from '../dist/FluentDB.client.js';

let div = document.createElement('div');
div.id = 'results';

test('client.filter', 
    fdb => fdb
        .filter(o => o.customer == 2)
        .execute(o => o),
    ds => 
        ds.filter(x => x.customer == 2).length > 0 && 
        ds.filter(x => x.customer != 2).length == 0
);

test('client.map', 
    fdb => fdb
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

test('client.sort',  
    fdb => fdb
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

test('client.groupReduce', 
    fdb => 
        fdb
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

sampleIdb('SampleDB', true, true)
    .then(() => 

        $$({c: $$.idb('customers', 'SampleDB')})
        .merge((c,o) => c.id == o.customer, 'both left')
        .import(c => c)
        .execute(c => c)

    )
    .then(data => {
        result = data.length == 11;
        div.innerHTML += (`idb.mergeImport:${result}`);
    })
    .catch(err => {
        div.innerHTML += (`idb.mergeImport:false;`);            
    })
    .finally(() => {
        document.body.appendChild(div);
    });

function test (
    testName,
    fdbWorker,
    tester
) { 

    let fdb = $$({ 
        c: sample.customers,
        o: sample.orders  
    })
    .catch(err => {
        div.innerHTML += `${testName}:false;`;
    });

    let results = fdbWorker(fdb);

    div.innerHTML += `${testName}:${tester(results)};`;

}

