import dsGetter from './dsGetter.js';

export default class extends dsGetter {

    constructor (collectionName, connector) {
        super();
        this.collectionName = collectionName;
        this.connector = connector;
        this.filterFunc;
    }

    filter(filterFunc) {

        if (!this.filterFunc) 
            this.filterFunc = filterFunc;
        else 
            this.filterFunc = this.filterFunc && filterFunc;

        return this;

    }

    map(mapFunc) {
            
        return this.connector
            .then(async client => {
                
                let db = client.db();
                let filterFunc = this.filterFunc || (x => true);
                    
                let results = [];

                await db.collection(this.collectionName)
                    .find()
                    .forEach(record => {
                        if (filterFunc(record))
                            results.push(mapFunc(record));
                    });
                
                // TODO: Add a connection close here in order to 
                // throw an error that as of this writing is not 
                // caught by the 'catch' statements of the tests.

                return results;

            });

    }

} 