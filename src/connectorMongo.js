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

} 