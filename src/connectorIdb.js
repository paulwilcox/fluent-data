import connector from './connector.js';
import dataset from './dataset.js';
import hashBuckets from './hashBuckets.js';

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

    merge (incoming, matchingLogic, mapper, onDuplicate) {

        console.log({
            incoming,
            matchingLogic: matchingLogic.toString().substring(0,25),
            mapper: mapper.toString().substring(0,25),
            onDuplicate
        })
        throw 'not implemented';

        /*

        let typeIx = ix => (Array.isArray(type) && type[ix]);
        let typeIn = (...args) => [...args].includes(type.toLowerCase());
        
        let updateIfMatched = typeIn('upsert', 'update', 'full') || typeIx(0);
        let deleteIfMatched = typeIn('delete') || typeIx(1);
        let insertIfNoTarget = typeIn('upsert', 'insert', 'full') || typeIx(2);
        let deleteIfNoSource = typeIn('full') || typeIx(3);

        return new Promise((resolve, reject) => {

            let incomingBuckets = 
                new hashBuckets(sourceIdentityKey)
                .addItems(source);
    
            let dbCon = this.dbConnector.open();

            dbCon.onsuccess = () => {

                let db = dbCon.result;

                let tx = db.transaction(this.storeName, "readwrite");
                let store = tx.objectStore(this.storeName);

                let storeCursor = store.openCursor();
                
                storeCursor.onsuccess = event => {

                    let cursor = event.target.result;

                    if (!cursor) {
                        
                        if (insertIfNoTarget) {
                                
                            let remainingItems = // source but no target
                                incomingBuckets.getBuckets()
                                .map(bucket => bucket[0]);
    
                            for(let item of remainingItems) {
                                let addRequest = store.add(item);
                                addRequest.onerror = event => reject(event); 
                            }
                        
                        }

                        return;

                    }

                    let sourceRow = 
                        incomingBuckets.getBucketFirstItem(
                            cursor.value, 
                            targetIdentityKey,
                            true 
                        );

                    if (sourceRow)
                        if (deleteIfMatched) 
                            cursor.delete();
                        else if (updateIfMatched) 
                            cursor.update(sourceRow);
        
                    else if (deleteIfNoSource) 
                        cursor.delete();

                    cursor.continue();

                } 
                    
                storeCursor.onerror = event => reject(event); 
                tx.oncomplete = () => db.close();
                tx.onerror = event => reject(event); 

            };

            dbCon.onerror = event => reject(event); 

        });
        */
    }    

} 