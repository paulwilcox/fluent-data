import connector from './connector.js';
import dataset from './dataset.js';
import hashBuckets from './hashBuckets.js';
import parser from './parser.js';

export default class extends connector {

    constructor (storeName, dbName) {
        super();
        this.dbName = dbName;
        this.storeName = storeName;
    }

    // A converter to a dataset for consumption in FluentDB
    import(mapFunc, filterFunc) {

        return new Promise((resolve, reject) => {

            let dbCon = window.indexedDB.open(this.dbName);
            dbCon.onerror = event => reject(event);             
            dbCon.onsuccess = () => {

                filterFunc = filterFunc || (x => true);                
                let results = [];
                let db = dbCon.result;
                
                let tx = db.transaction(this.storeName);
                tx.oncomplete = () => db.close(); 
                tx.onerror = event => reject(event); 
                
                let store = tx.objectStore(this.storeName);

                let storeCursor = store.openCursor();
                storeCursor.onerror = event => reject(event);                
                storeCursor.onsuccess = event => {

                    let cursor = event.target.result;

                    if (!cursor) {
                        resolve(new dataset(results));
                        return;
                    }

                    if (filterFunc(cursor.value))
                        results.push(
                            mapFunc(cursor.value)
                        );

                    cursor.continue();

                } 
                
            };

        });

    }

    merge (
        incoming, 
        matchingLogic, 
        mapper, 
        distinct = false
    ) {

        return new Promise((resolve, reject) => {

            let keyFuncs = parser.pairEqualitiesToObjectSelectors(matchingLogic);
            let targetKeyFunc = keyFuncs.leftFunc;
            let sourceKeyFunc = keyFuncs.rightFunc;    

            let incomingBuckets = 
                new hashBuckets(sourceKeyFunc, true, distinct)
                .addItems(incoming);
    
            let dbCon = window.indexedDB.open(this.dbName);
            dbCon.onerror = event => reject(event); 

            dbCon.onsuccess = () => {

                let db = dbCon.result;

                let tx = db.transaction(this.storeName, "readwrite");
                tx.oncomplete = () => db.close();
                tx.onerror = event => reject(event); 

                let store = tx.objectStore(this.storeName);

                let storeCursor = store.openCursor();
                storeCursor.onerror = event => reject(event); 
                storeCursor.onsuccess = event => {

                    let cursor = event.target.result;
                    let rowsToAdd = []; 

                    // When you've finished looping the target, add 
                    // any excess rows to the store.  Then resolve. 
                    if (!cursor) {                           
                        for(let row of rowsToAdd) {
                            let addRequest = store.add(row);
                            addRequest.onerror = event => reject(event); 
                        }
                        resolve(this);
                        return;
                    }

                    // Finds the bucket of incoming rows matching the 
                    // target and 'crossMaps' them.  Returns a generator. 
                    let outputGenerator = incomingBuckets.crossMapRow(
                        cursor.value, 
                        targetKeyFunc,
                        true,
                        mapper
                    );

                    // For the first match, delete or update. based on
                    // whether there's a match or not.
                    let outputYield = outputGenerator.next();
                    outputYield.done 
                        ? cursor.delete()
                        : cursor.update(outputYield.value);

                    // For additional matches, add them to the rowsToAdd array.
                    outputYield = outputGenerator.next();
                    while (outputYield.done === false) {
                        rowsToAdd.push(outputYield.value); // I (psw) don't know if store.add is safe here
                        outputYield = outputGenerator.next();
                    }

                    cursor.continue();

                } 
                    
            };

        });
        
    }    

} 