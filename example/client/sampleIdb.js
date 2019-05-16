import { sampleDataSets } from '../sampleDataSets.js';
import "../../node_modules/idb/lib/idb.js";

//window.indexedDB.deleteDatabase('sampleIdb');

export let sampleIdb = 
    idb.open(
        'sampleIdb', 
        1, 
        udb => {            
            if (udb.oldVersion == 0) 
                for (let datasetName of Object.keys(sampleDataSets)) 
                    udb.createObjectStore(datasetName, {keyPath: 'id'});
        }
    )
    .then(db => {

        for (let datasetKvp of Object.entries(sampleDataSets)) {

            let store = 
                db
                .transaction(datasetKvp[0], "readwrite")
                .objectStore(datasetKvp[0]);     

            if (datasetKvp[0] == 'foods')
                store.clear();

            for (let row of datasetKvp[1]) 
                store.put(row);
                        
        }          

        return db;

    });


