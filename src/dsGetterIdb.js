import * as g from './general.js';
import { dsGetter } from './dsGetter.js';
import { dataset } from './dataset.js';
import { hashBuckets } from './hashBuckets.js';

export class dsGetterIdb extends dsGetter {

    constructor (storeName, idbConnector) {
        super(idbConnector);
        this.storeName = storeName;
        this.filterFunc;
    }

    filter(filterFunc) {

        if (!this.filterFunc) 
            this.filterFunc = filterFunc;
        else 
            this.filterFunc = this.filterFunc && filterFunc;

        return this;

    }

    // - thanks netchkin at https://stackoverflow.com/questions/46326212/
    //   how-to-return-indexeddb-query-result-out-of-event-handler
    // - also see "using a cursor" at https://developer.mozilla.org/en-US/
    //   docs/Web/API/IndexedDB_API/Using_IndexedDB
    map(mapFunc) {

        return new Promise((resolve, reject) => {

            let dbCon = this.dbConnector.open();
            
            dbCon.onsuccess = () => {

                let db = dbCon.result;
                let tx = db.transaction(this.storeName);
                let store = tx.objectStore(this.storeName);
                let filterFunc = this.filterFunc || (x => true);
                let results = [];

                let storeCursor = store.openCursor();
                
                storeCursor.onsuccess = event => {

                    let cursor = event.target.result;

                    if (!cursor) {
                        resolve(results);
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
        targetIdentityKey,
        source,
        allowDelete = false
    ) {

        return new Promise((resolve, reject) => {

            let sourceArray = 
                g.isFunction(source) ? this.getDataset(source).callWithoutModify('map', source)
                : source instanceof dataset ? source.data
                : Array.isArray(source) ? source
                : null; 

            if (!Array.isArray(sourceArray))
                throw 'parameter "source" failed to convert to an array.';

            let incomingBuckets = 
                new hashBuckets(targetIdentityKey)
                .addItems(sourceArray);
    
            let dbCon = this.dbConnector.open();
            
            dbCon.onsuccess = () => {

                let db = dbCon.result;
                let tx = db.transaction(this.storeName, "readwrite");
                let store = tx.objectStore(this.storeName);

                let storeCursor = store.openCursor();
                
                storeCursor.onsuccess = event => {

                    let cursor = event.target.result;

                    if (!cursor) {
                        
                        let remainingItems = // source but no target
                            incomingBuckets.getBuckets()
                            .map(bucket => bucket[0]);
        
                        for(let item of remainingItems) {
                            let addRequest = store.add(item);
                            addRequest.onerror = event => reject(event); 
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
                        cursor.update(sourceRow);
        
                    else if (allowDelete) // target but no source
                        cursor.delete();

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
