import * as g from './general.js';
import { parser } from './parser.js';
import { deferable } from './deferable.js';
import { database } from './database.js';
import { dbConnectorIdb } from './dbConnectorIdb.js';
import { dbConnector } from './dbConnector.js';
import { dsGetter } from './dsGetter.js';
import { reducer, runEmulators } from './reducer.js';
import { thenRemoveUndefinedKeys } from './mapper.js';

export default function $$(obj) { 
    return new FluentDB().addSources(obj); 
}

class FluentDB extends deferable {

    constructor() {
        super(new database())
        this.mpgExtend(
            'addSources, filter, map, join, group, sort, reduce, ' + 
            'print, merge'
        );
    }

    execute (finalMapper) {
        
        let result = super.execute();

        if (finalMapper === undefined)
            return result;

        let param = parser.parameters(finalMapper)[0];
        finalMapper = thenRemoveUndefinedKeys(finalMapper);

        return g.isPromise(result) 
            ? result.then(db => db.getDataset(param).data.map(finalMapper))
            : result.getDataset(param).data.map(finalMapper);
        
    }

    mpgExtend (funcNamesCsv) {

        let funcNames = 
            funcNamesCsv
            .split(',')
            .map(fn => fn.trim());

        for(let funcName of funcNames) 
            this[funcName] = function(...args) {
                return this
                    .then(db => this.managePromisesAndGetters(db, args, funcName))
                    .then(db => {
                        let dsGetter = this.dsGetterIfCallable(db, args, funcName);
                        return (dsGetter || db)[funcName](...args);
                    })
                    .then(db => this.managePromisesAndGetters(db, args, funcName));
            };
        
    } 

    // if args reference a dsGetter one time, and that
    // getter has a function referred to by funcName, 
    // then return that getter so that you can then 
    // call the function on it instead of on FluentDB.
    dsGetterIfCallable (db, args, funcName) {

        let datasets = [];
        
        for (let arg of args) 
            if (g.isFunction(arg)) 
                for (let ds of db.getDatasets(arg, false))
                    datasets.push(ds);

        return !(datasets.data instanceof dsGetter) ? null 
            : datasets.length != 1 ? null 
            : datasets[0].data[funcName] ? datasets[0]
            : null;
        
    }

    managePromisesAndGetters (db, args) {

        // Initializations

            let datasets = [];             

        // Get related datasets
            
            // For any function passed as an argument, see 
            // what datasets it may be referring to (via the
            // parameters)
            
            for(let arg of args)
                if (g.isFunction(arg)) {
                    let dss = db.getDatasets(arg, false);
                    if (dss.length > 0)
                        datasets.push(...dss);
                }

            if (datasets.length == 0)
                return db;

        // Resolve dsGetters
            
            for(let ds of datasets) 
                if (ds.data instanceof dsGetter) 
                    ds.data = ds.data.map(x => x); 

        // Merge promises

            if (datasets.filter(ds => g.isPromise(ds.data)).length == 0)
                return db;

            let keys = datasets.map(ds => ds.key);
            let datas = datasets.map(ds => ds.data);

            return Promise.all(datas).then(datas => {
                for(let i in keys) 
                    db.getDataset(keys[i]).data = datas[i];
                return db;
            });

    };

}

$$.reducer = reducer;
$$.runEmulators = runEmulators;

$$.reducer($$, 'first', v => v, array => array.reduce((a,b) => a || b));
$$.reducer($$, 'last', v => v, array => array.reduce((a,b) => b || a));
$$.reducer($$, 'sum', v => v, array => array.reduce((a,b) => a + b));
$$.reducer($$, 'count', v => v, array => array.reduce((a,b) => a + 1, 0));

$$.reducer($$, 'avg', v => v, array => {

    let agg = runEmulators(array, val => ({
        sum: $$.sum(val), 
        count: $$.count(val)     
    }));

    return agg.sum / agg.count

});

$$.reducer($$, 'mad', v => v, array => {

    let agg = runEmulators(array, val => $$.avg(val));

    for (let ix in array)
        array[ix] = Math.abs(array[ix] - agg);

    return runEmulators(array, val => $$.avg(val));
    
});

$$.reducer($$, 'cor', (x,y) => ({ x, y }), data => {

    let agg = runEmulators(data, row => ({ 
        xAvg: $$.avg(row.x), 
        yAvg: $$.avg(row.y) 
    }));

    for(let ix in data) 
        data[ix] = { 
            xDiff: data[ix].x - agg.xAvg, 
            yDiff: data[ix].y - agg.yAvg
        };

    agg = runEmulators(data, row => ({
        xyDiff: $$.sum(row.xDiff * row.yDiff), 
        xDiffSq: $$.sum(row.xDiff ** 2),
        yDiffSq: $$.sum(row.yDiff ** 2)    
    }));

    return agg.xyDiff / (agg.xDiffSq ** 0.5 * agg.yDiffSq ** 0.5);
    
});

$$.idb = dbName => new dbConnectorIdb(dbName);
$$.dbConnector = dbConnector;
$$.dsGetter = dsGetter;  

