import connector from './connector.js';
import { MongoClient } from 'mongodb';
import dataset from './dataset.js';
import hashBuckets from './hashBuckets.js';
import parser from './parser.js';
import { print as prn } from './visualizer/printer.js';
import { normalizeMapper } from './mergeTools.js';

export default class extends connector {

    constructor (collectionName, url) {
        super();
        this.collectionName = collectionName;
        this.client = MongoClient.connect(url, {useNewUrlParser: true});
    }

    import(mapFunc, filterFunc) {
            
        return this.client.then(async client => {
                
            filterFunc = filterFunc || (x => true);
            let db = client.db();
            let results = [];

            await db.collection(this.collectionName)
                .find()
                .forEach(record => {
                    if (filterFunc(record))
                        results.push(mapFunc(record));
                });
            
            return new dataset(results);

        });

    }

    print(mapFunc, caption, target) {
            
        this.client = this.client.then(async client => {

            let db = client.db();
            let results = [];

            await db.collection(this.collectionName)
                .find()
                .forEach(record => results.push(mapFunc(record)));

            target ? prn(target, results, caption)
                : caption ? console.log(caption, results) 
                : console.log(results);

            return client;

        });

        return this;

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
        let processedTargets = new hashBuckets(targetKeyFunc, true);
        let mapper = normalizeMapper(mapFunc);

        let incomingBuckets = 
            new hashBuckets(sourceKeyFunc, distinct)
            .addItems(incoming);

        this.client = this.client.then(async client => {

            let db = client.db();
            let col = await db.collection(this.collectionName);

            await col.find().forEach(record => {

                // If user wants distinct rows in the target, then
                // track if such a row has already been processed.
                // If so, delete future rows in the target.  If not,
                // just record that it has now been processed.
                if (distinct) {  
                    let processedTarget = processedTargets.getBucket(record, targetKeyFunc);
                    if (processedTarget) {
                        col.removeOne( { _id: record._id });
                        return;
                    }
                    processedTargets.addItem(record);
                }

                // Finds the bucket of incoming rows matching the 
                // target and 'crossMaps' them.  Returns a generator. 
                let outputGenerator = incomingBuckets.crossMapRow(
                    record, 
                    targetKeyFunc,
                    mapper
                );

                // For the first match, delete or update. based on
                // whether there's a match or not.
                let outputYield = outputGenerator.next();
                (outputYield.done) 
                    ? col.removeOne({ _id: record._id })
                    : col.replaceOne({ _id: record._id }, outputYield.value);

                // For additional matches, insert them to the collection.
                outputYield = outputGenerator.next();
                while (outputYield.done === false) {
                    delete outputYield.value._id; // needs a new id
                    col.insertOne(outputYield.value);
                    outputYield = outputGenerator.next();
                }

            })
  
            return client;

        })

        return this;

    }
    

} 