import idb from '../node_modules/sampledb/dist/SampleDB.idb.js';

async function test () {

    let db = await 
        idb('SampleDB')
        .reset('/test/_SampleDB.json', null, true)
        .connect();

    let storeReqest = 
        db.transaction('customers')
        .objectStore('customers')
        .getAll();

    return new Promise((res,rej) => {
        storeReqest.onsuccess = event => {
            let rows = event.target.result;
            res(rows.length > 0);
        };
        storeReqest.onerror = event => { throw storeReqest.error; };
    });

}