import { dsGetter } from './dsGetter.js';

export class dsGetterMongo extends dsGetter {

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
            .then(db => {
                
                let filterFunc = this.filterFunc || (x => true);
                
                let results = 
                    db.collection(this.collectionName)
                    .find(filterFunc)
                    .map(mapFunc)
                    .toArray();
                
                db.close(); // TODO: decide if I want to close here or elsewhere or at all
                
                return results;

            });

    }

} 