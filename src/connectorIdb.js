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
            
            dbCon.onsuccess = () => {

                filterFunc = filterFunc || (x => true);
                let db = dbCon.result;
                let tx = db.transaction(this.storeName);
                let store = tx.objectStore(this.storeName);
                let storeCursor = store.openCursor();
                let results = [];
                
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
                
                storeCursor.onerror = event => reject(event);
                tx.oncomplete = () => db.close(); 
                tx.onerror = event => reject(event); 

            };

            dbCon.onerror = event => reject(event); 

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
            let targetKeyFunc = keyFuncs[0];
            let sourceKeyFunc = keyFuncs[1];    

            let incomingBuckets = 
                new hashBuckets(sourceKeyFunc, true, distinct)
                .addItems(incoming);
    
            let dbCon = this.dbConnector.open();

            dbCon.onsuccess = () => {

                let db = dbCon.result;

                let tx = db.transaction(this.storeName, "readwrite");
                let store = tx.objectStore(this.storeName);

                let storeCursor = store.openCursor();
                
                storeCursor.onsuccess = event => {

                    let cursor = event.target.result;
                    let rowsToAdd = []; 

                    if (!cursor) {                           
                        for(let row of rowsToAdd) {
                            let addRequest = store.add(row);
                            addRequest.onerror = event => reject(event); 
                        }
                        resolve(store);
                        return;
                    }

                    let outputRows = incomingBuckets.crossMapRow(
                        cursor.value, 
                        targetKeyFunc,
                        true,
                        mapper
                    );

                    if (outputRows.done)
                        cursor.delete();
                    else {
                        let outputRow = outputRows.next();
                        let updatedAlready = false;
                        while (!outputRows.done) {
                            if(!updatedAlready) {
                                cursor.update(outuptRow);
                                updatedAlready = true;
                            } 
                            else 
                                rowsToAdd.push(outputRow); // I (psw) don't know if store.add is safe here
                            outputRow = outputRows.next();
                        }
                    }

                    cursor.continue();

                } 
                    
                storeCursor.onerror = event => reject(event); 
                tx.oncomplete = () => db.close();
                tx.onerror = event => reject(event); 

            };

            dbCon.onerror = event => reject(event); 

        });
        
    }    

} 