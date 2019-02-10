import * as g from './general.js';
import { deferable } from './deferable.js';
import { database } from './database.js';
import { dbConnectorIdb } from './dbConnectorIdb.js';
import { dsGetter } from './dsGetter.js';
import { joiner } from './joiner.js';

export class oneQuery extends deferable {

    constructor() {

        super(new database());
        this.before(args => managePromisesAndGetters(this.value, args));
        this.after(args => managePromisesAndGetters(this.value, args));

        function managePromisesAndGetters (db, args) {

            // Initializations

                //let db = this.value;
                let datasets = []; 
                
            // Get related datasets
                
                // For any function passed as an argument, see 
                // what datasets it may be referring to (via the
                // parameters)
                
                for(let arg of args)
                    if (g.isFunction(arg))
                        datasets.push(...db.getDatasets(arg));

                if (datasets.length == 0)
                    return db;

            // Resolve dsGetters, identify promises
                
                let keys = [];
                let promises = [];

                for(let ds of datasets) {

                    // If more than one dataset is referenced in the
                    // function, you'll want to resolve any of them
                    // that are in a dsGetter state or else the two
                    // will have trouble working with each other.
                    if (ds instanceof dsGetter && datasets.length > 1)
                        ds.map(x => x); 

                    // If any dataset is a a promise (by means of 
                    // resolving the getter or otherwise), then 
                    // store its keys and data.
                    if (g.isPromise(ds.data)){
                        keys.push(ds.key);
                        promises.push(ds.data);
                    }

                }
            
            // Merge promises

                if (promises.length == 0)
                    return db;

                promises.push(keys); // quick add for convenience, you'll extract immediately
                promises.push(db); // ditto

                return Promise.all(promises)
                    .then(array => {

                        let db = array.pop(); // told you so
                        let keys = array.pop(); // ditto
                        let promises = array; // now its just proises again

                        for(let i in keys) 
                            db.getDataset(keys[i]).data = promises[i];

                        return db;

                    });

        };

    }

}

deferable.deferify(
    oneQuery.prototype, 
    'addSources, filter, map, dual'
);

export let $$ = obj => new oneQuery().addSources(obj);

oneQuery.idb = dbName => new dbConnectorIdb(dbName);
$$.idb = oneQuery.idb;


// for the sake of: 
//   ...join($$.left(arrowFunc), $$.inner(arrowFunc))  
joiner.forEachJoinType(joinType => {

    database[joinType] = (matchingLogic, algorithm = 'default') => ({
        joinType: joinType,
        matchingLogic,
        algorithm
    });     

    $$[joinType] = database[joinType];

})