import connector from './connector.js';
import dataset from './dataset.js';
import hashBuckets from './hashBuckets.js';
import parser from './parser.js';
import { print as prn } from './visualizer/printer.js';

export default class extends connector {

    constructor (storeName, dbName) {
        super();
        this.dbName = dbName;
        this.storeName = storeName;
    }

    // A converter to a dataset for consumption in FluentDB
    import(mapFunc, filterFunc) {

        filterFunc = filterFunc || (x => true);                
        let results = [];

        return this.curse(cursor => {

            if (!cursor) 
                return new dataset(results);

            if (filterFunc(cursor.value))
                results.push(
                    mapFunc(cursor.value)
                );

            cursor.continue();

        });

    }

    print(mapFunc, caption, target) {
            
        let results = [];

        return this.curse(cursor => {

            if (!cursor) {
                target ? prn(target, results, caption)
                    : caption ? console.log(caption, results) 
                    : console.log(results);
                return this;
            }             

            results.push(
                mapFunc(cursor.value)
            );

            cursor.continue();

        });

    }

    merge (
        incoming, 
        matchingLogic, 
        mapper, 
        distinct = false
    ) {

        let keyFuncs = parser.pairEqualitiesToObjectSelectors(matchingLogic);
        let targetKeyFunc = keyFuncs.leftFunc;
        let sourceKeyFunc = keyFuncs.rightFunc;    

        let incomingBuckets = 
            new hashBuckets(sourceKeyFunc, true, distinct)
            .addItems(incoming);

        let rowsToAdd = []; 

        return this.curse((cursor, store) => {

            // When you've finished looping the target, add 
            // any excess rows to the store.  Then resolve. 
            if (!cursor) {                           
                for(let row of rowsToAdd) {
                    let addRequest = store.add(row);
                    addRequest.onerror = event => reject(event); 
                }
                return this;
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

        }, 'readwrite');
        
    }
    
    curse ( 
        func,
        transactionMode = 'readonly'
    ) {

        return new Promise((resolve, reject) => {

            let dbCon = window.indexedDB.open(this.dbName);
            dbCon.onerror = event => reject(event); 
    
            dbCon.onsuccess = () => {
    
                let db = dbCon.result;
    
                let tx = db.transaction(this.storeName, transactionMode);
                tx.oncomplete = () => db.close();
                tx.onerror = event => reject(event); 
    
                let store = tx.objectStore(this.storeName);
    
                let storeCursor = store.openCursor();
                storeCursor.onerror = event => reject(event); 
                storeCursor.onsuccess = event => {
                    let cursor = event.target.result;    
                    let completionResult = func(cursor, store);
                    if (completionResult !== undefined)
                        resolve(completionResult);
                }

            }

        });

    }

} 