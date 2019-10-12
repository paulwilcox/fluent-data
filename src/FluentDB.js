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

    test (
        testName = 'test',
        finalMapper,
        boolFunc, 
        catchFunc = err => err
    ) {

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
            ? data.then(process)
            : process(data);

    }

    // TODO: Close all dsConnector connections
    execute (finalMapper) {
        
        let result = super.execute();

        if (this.status == 'rejected')
            return result;

        if (finalMapper === undefined)
            return result;

        let param = parser.parameters(finalMapper)[0];
        finalMapper = thenRemoveUndefinedKeys(finalMapper);

        if (!g.isPromise(result))
            return result.getDataset(param).data.map(finalMapper);

        return result
            .then(db => db.getDataset(param).data.map(finalMapper))
            .catch(err => {
                if (this.catchFunc)
                    return this.catchFunc(err);
                throw err;
            });

    }

    mpgExtend (funcNamesCsv) {

        let funcNames = 
            funcNamesCsv
            .split(',')
            .map(fn => fn.trim());

        for(let funcName of funcNames) 
            this[funcName] = function(...args) { return this.then(db => {

                let dsg = this.dsGetterIfCallable(db, args, funcName);
                if (dsg)
                    return dsg[funcName](...args);

                let funcArgs = g.flattenArray(
                    args
                    .filter(a => g.isFunction(a))
                    .map(a => parser.parameters(a))
                );

                let dsGetters = 
                    funcArgs
                    .filter((a,i,self) => self.indexOf(a) == i) // distinct
                    .map(p => db.getDataset(p))
                    .filter(ds => ds != undefined && ds.data instanceof dsGetter);

                for(let dsGetter of dsGetters) 
                    dsGetter.data = dsGetter.data.map(x => x);

                let hasPromises = db.datasets.filter(ds => g.isPromise(ds.data)).length > 0; 
                if (hasPromises) 
                    return Promise.all(db.datasets.map(ds => ds.data))
                    .then(datas => {
                        for(let i in db.datasets) 
                            db.datasets[i].data = datas[i];
                        return db;
                    })                      
                    .then(db => db[funcName](...args));

                return db[funcName](...args);

            });};
        
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

