import * as idb from 'idb';
import sample from './sampleData.client.js';

export default async function (dbName, reset) { 

    if (reset)
        await indexedDB.deleteDatabase(dbName);

    let data = reset || sample;

    return idb.open(dbName, 1, db => {            
        for (let name of db.objectStoreNames) 
            db.deleteObjectStore(name);
        for (let name of Object.keys(data)) 
            db.createObjectStore(name, {keyPath: 'id'});
    })
    .then(db => {

        for (let datasetKvp of Object.entries(data)) {

            let store = 
                db.transaction(datasetKvp[0], "readwrite")
                .objectStore(datasetKvp[0]);     

            store.clear();

            for (let row of datasetKvp[1]) 
                store.put(row);
                        
        }          

        return db;

    });

}