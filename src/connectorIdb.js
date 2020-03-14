import dataset from './dataset.js';
import hashBuckets from './hashBuckets.js';
import parser from './parser.js';
import { normalizeMapper } from './mergeTools.js';

export default class {

    constructor (storeName, dbName) {
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

    print(mapFunc, caption) {
            
        let results = [];

        return this.curse(cursor => {

            if (!cursor) {
                // TODO: Do I need to implement .with() here?
                caption 
                    ? console.log(caption, results) 
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
        mapFunc, 
        distinct = false
    ) {

        let keyFuncs = parser.pairEqualitiesToObjectSelectors(matchingLogic);
        let targetKeyFunc = keyFuncs.leftFunc;
        let sourceKeyFunc = keyFuncs.rightFunc;    
        let rowsToAdd = []; 
        let processedTargets = new hashBuckets(targetKeyFunc, true);
        let mapper = normalizeMapper(mapFunc);

        let incomingBuckets = 
            new hashBuckets(sourceKeyFunc, distinct)
            .addItems(incoming);

        return this.curse((cursor, store) => {

            // When you've finished looping the target, add 
            // any excess rows to the store.  Then resolve. 
            if (!cursor) {        
                console.log({rowsToAdd})                   
                for(let row of rowsToAdd) {
                    let addRequest = store.add(row);
                    addRequest.onerror = event => { 
                        throw event.target.error; 
                    }; 
                }
                return this;
            }

            // If user wants distinct rows in the target, then
            // track if such a row has already been processed.
            // If so, delete future rows in the target.  If not,
            // just record that it has now been processed.
            if (distinct) {  
                let processedTarget = processedTargets.getBucket(cursor.value, targetKeyFunc);
                if (processedTarget) {
                    cursor.delete();
                    cursor.continue();
                    return;
                }
                processedTargets.addItem(cursor.value);
            }

            // Finds the bucket of incoming rows matching the 
            // target and 'crossMaps' them.  Returns a generator. 
            let outputGenerator = incomingBuckets.crossMapRow(
                cursor.value, 
                targetKeyFunc,
                mapper
            );

            // For the first match, delete or update. based on
            // whether there's a match or not.
            let outputYield = outputGenerator.next();

            try {
                outputYield.done 
                    ? cursor.delete()
                    : cursor.update(outputYield.value);
            }
            catch(err) {
                let isKeyError = 
                    err.message.includes('cursor uses in-line keys')
                    && err.message.includes('different value than the cursor\'s effective key')
                if (!isKeyError)
                    throw err;
                let newErr = new Error(
                    'The error message below means that you are trying ' + 
                    'to update a row in IndexedDB with another row ' + 
                    'where the primary keys are not the same.  Are ' +
                    'you matching on keys with different names?  If so ' +
                    'try changing the name (using .map()) of the incoming ' +
                    'foreign key to match the target\'s primary key. \n\n' +
                    'Otherwise, play around with the in-line/out-of-line ' +
                    'and auto-incrementing features of your store.  And ' +
                    'it may also be possible that in its present state, ' +
                    'this library cannot support the structure of your ' +
                    'store. \n\n-- expand to see stack --\n\n' + 
                    '------------- \n\n' +
                    err.message
                );
                newErr.originalError = err;
                throw newErr;
            }

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
                let tx;
                
                try {
                    tx = db.transaction(this.storeName, transactionMode);
                }
                catch(err) {
                    throw err.name == "NotFoundError" 
                        ? `${this.storeName} not found in ${this.dbName}`
                        : err
                }

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