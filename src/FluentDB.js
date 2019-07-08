import * as g from './general.js';
import { deferable } from './deferable.js';
import { database } from './database.js';
import { dbConnectorIdb } from './dbConnectorIdb.js';
import { dsGetter } from './dsGetter.js';
import { folders, foldBuilder, emulator } from './foldTools.js';

export default function $$(obj) { 
    return new FluentDB().addSources(obj); 
}

class FluentDB extends deferable {

    constructor() {
        super(new database())
        this.mpgExtend(
            'addSources, filter, map, join, group, sort, fold, ' + 
            'print, printExternal, merge, mergeExternal'
        );
    }

    execute (finalMapper) {
        
        let result = super.execute();
        
        return finalMapper === undefined ? result
            : g.isPromise(result) ? result.then(db => db.getDataset(finalMapper).data.map(finalMapper))
            : result.getDataset(finalMapper).data.map(finalMapper);
        
    }

    mpgExtend (funcNamesCsv) {

        let funcNames = 
            funcNamesCsv
            .split(',')
            .map(fn => fn.trim());

        for(let funcName of funcNames) 
            this[funcName] = function(...args) {
                return this
                    .then(db => this.managePromisesAndGetters(db, args))
                    .then(db => db[funcName](...args))
                    .then(db => this.managePromisesAndGetters(db, args));
            };
        
    } 

    managePromisesAndGetters (db, args) {

        // Initializations

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

$$.foldBuilder = (name) => {
    folders[name] = new foldBuilder();
    $$[name] = (...vals) => new emulator(name, vals);
    return folders[name];
}

$$.foldBuilder('first').fold((a,b) => a, null, a => a != null);
$$.foldBuilder('last').fold((a,b) => b);
$$.foldBuilder('sum').fold((a,b) => a + b);
$$.foldBuilder('count').fold((a,b) => a + 1, 0);

$$.foldBuilder('avg')
    .emulators(v => ({ 
        sum: $$.sum(v), 
        count: $$.count(v) 
    }))
    .changeFolded(agg => agg.sum / agg.count);

$$.foldBuilder('mad')
    .emulators(v => $$.avg(v))
    .changeData((dataRow,agg) => Math.abs(dataRow - agg)) 
    .emulators(v => $$.avg(v));

$$.foldBuilder('cor') 
    .emulators((x,y) => ({ xAvg: $$.avg(x), yAvg: $$.avg(y) }))
    .changeData((row, agg) => ({ 
        // Knowing that the data will be row[0] and row[1] will 
        // be difficult on the user.  Is there anything that can
        // be done about this?
        //
        // At present my thoughts are to allow the user to capture
        // what happens to ...vals inside of $$[name] above. 
        xDiff: row[0] - agg.xAvg, 
        yDiff: row[1] - agg.yAvg
    }))
    .emulators(row => ({  
        xyDiff: $$.sum(row.xDiff * row.yDiff), 
        xDiffSq: $$.sum(row.xDiff ** 2),
        yDiffSq: $$.sum(row.yDiff ** 2)
    }))
    .changeFolded(agg => agg.xyDiff / (agg.xDiffSq ** 0.5 * agg.yDiffSq ** 0.5));

$$.idb = dbName => new dbConnectorIdb(dbName);
  

