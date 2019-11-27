import connector from './connector.js';
import { MongoClient } from 'mongodb';

export default class extends connector {

    constructor (collectionName, url) {
        super();
        this.collectionName = collectionName;
        this.client = MongoClient.connect(url, {useNewUrlParser: true});
    }

    import(mapFunc, filterFunc) {
            
        return this.client
            .then(async client => {
                
                filterFunc = this.filterFunc || (x => true);
                let db = client.db();
                let results = [];

                await db.collection(this.collectionName)
                    .find()
                    .forEach(record => {
                        if (filterFunc(record))
                            results.push(mapFunc(record));
                    });
                
                return results;

            });

    }

} 