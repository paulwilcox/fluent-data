import * as g from './general.js';
import parser from './parser.js';
import deferable from './deferable.js';
import database from './database.js';
import dbConnectorIdb from './dbConnectorIdb.js';
import dbConnector from './dbConnector.js';
import dsGetter from './dsGetter.js';
import { reducer, runEmulators } from './reducer.js';

export default function $$(obj) { 
    return new FluentDB().addSources(obj); 
}

class FluentDB extends deferable {

    constructor() {
        super(new database());
        this.attachDbFuncs(
            'addSources', 'filter', 'map', 
            'group', 'sort', 
            'reduce', 'print', 'merge'
        );
    }
 
    mergeExternal (
        type, // update, insert, delete, upsert, full, or [] of 4 bools
        targetIdentityKey, 
        sourceIdentityKey  
    ) {

        this.then(async db => {

            let target = db.getDataset(targetIdentityKey).data;

            if (!(target instanceof dsGetter))
                throw 'target dataset is not a dsGetter.  Use "merge" instead.'

            let source = await 
                db.getDataset(sourceIdentityKey)
                .callWithoutModify('map', x => x); // just get the raw data

            // TODO: decide wether we want to await the merge or not, or give the option
            target.merge(type, targetIdentityKey, sourceIdentityKey, source);

            return db;

        });

        return this;

    }

    test (
        testName = 'test',
        finalMapper,
        boolFunc, 
        catchFunc = err => err
    ) {

        if (testName == 'notest')
            return undefined;

        let _catchFunc = err => ({
            testName,
            result: false,
            error: catchFunc(err) 
        })

        let data;
        try {data = this.execute(finalMapper);}
        catch (err) {return _catchFunc(err);}

        let process = rows => {
            try {

                // if it's not an array, it's the result of a catch
                if (!Array.isArray(rows))
                    throw rows;

                return { 
                    testName,
                    result: boolFunc(rows)
                };

            }
            catch(err) {
                return _catchFunc(err);
            }
        }

        return g.isPromise(data) 
            ? data.then(process).catch(_catchFunc)
            : process(data);

    }

    // TODO: Close all dsConnector connections
    execute (finalMapper) {

        let catcher = err => { 
            if (this.catchFunc)
                return this.catchFunc(err);
            throw err;
        }
        
        try {        

            let db = super.execute();

            let param = parser.parameters(finalMapper)[0];
            finalMapper = g.noUndefinedForFunc(finalMapper);

            if (this.status == 'rejected' || finalMapper === undefined)
                return db;
    
            db = this.promisifyDbIfNecessary(db);

            return g.isPromise(db) 
                ? db.then(db => db.getDataset(param).data.map(finalMapper)).catch(catcher)
                : db.getDataset(param).data.map(finalMapper);

        }

        catch(err) {
            return catcher(err);
        }

    }

    attachDbFuncs (...funcNames) {

        for(let funcName of funcNames) 
            this[funcName] = function(...args) { return this.then(db => {

                db = this.resolveGetters(db, funcName, args);
                db = this.promisifyDbIfNecessary(db);
                
                return (g.isPromise(db)) 
                    ? db.then(db => db[funcName](...args))
                    : db[funcName](...args);

            });};
        
    } 

    resolveGetters(db, funcName, args) {

        let argDatasets = this.argumentDatasets(db, args);
        let foundGetters = 0;

        for(let i = argDatasets.length - 1; i >= 0; i--) {

            let argDs = argDatasets[i];
            let hasFunc = argDs.data[funcName] ? true : false;
            let isGetter = argDs.data instanceof dsGetter;
            if (isGetter)
                foundGetters++;

            // - If the first dataset arg is a dsGetter, and it is the only dsGetter,
            //   and the dsGetter has the function being called, then use the function
            //   on that getter.    
            if (i == 0 && isGetter && foundGetters == 1 && hasFunc && funcName != 'merge') 
                argDs.data = argDs.data[funcName](...args);
            else if (isGetter) 
                argDs.data = argDs.data.map(x => x);

        }

        return db;

    }

    promisifyDbIfNecessary (db) {
        
        if (g.isPromise(db))
            return db;

        let hasPromises = db.datasets.filter(ds => g.isPromise(ds.data)).length > 0; 

        if (!hasPromises)
            return db;

        return Promise.all(db.datasets.map(ds => ds.data))
            .then(datas => {
                for(let i in db.datasets) 
                    db.datasets[i].data = datas[i];
                return db;
            });

    }

    // Get datasets from passed arguments
    argumentDatasets (db, args) {

        let funcArgs = g.flattenArray(
            args
            .filter(a => g.isFunction(a))
            .map(a => parser.parameters(a))
        );

        return funcArgs
            .filter((a,i,self) => self.indexOf(a) == i) // distinct
            .map(p => db.getDataset(p))
            .filter(p => p); // some function params don't represent datasets

    }

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

$$.round = (term, digits) => Math.round(term * 10 ** digits) / 10 ** digits

$$.idb = dbName => new dbConnectorIdb(dbName);
$$.dbConnector = dbConnector;
$$.dsGetter = dsGetter;  

