import * as idb from 'idb';
import sample from './sampleData.client.js';

export default async function (dbName, reset, keyPaths) { 

    if (reset)
        await indexedDB.deleteDatabase(dbName);

    return idb.open(dbName, 1, async db => { 

        let data = Object.keys(reset).length > 0 ? reset : sample;
        keyPaths = keyPaths || Object.keys(data).map(key => ({ [key]: 'id' }));

        for (let name of db.objectStoreNames) 
            await db.deleteObjectStore(name);

        for (let key of Object.keys(data)) { 

            // if the first row of the store contains the expected key, 
            // then no autoincrement, otherwise yes.
            let store = await db.createObjectStore(key, {
                keyPath: keyPaths[key],
                autoIncrement: data[key].length > 0 && !Object.keys(data[key][0]).includes(keyPaths[key])
            });

            for (let row of data[key]) 
                store.put(row);

        }

        return db

    });

}