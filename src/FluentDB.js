import * as g from './general.js';
import parser from './parser.js';
import deferable from './deferable.js';
import database from './database.js';
import { reducer, runEmulators } from './reducer.js';
import connector from './connector.js';
import connectorIdb from './connectorIdb.js';

export default function $$(obj) { 
    return new FluentDB().addDatasets(obj); 
}

class FluentDB extends deferable {

    constructor() {

        super(new database());

        super.promisifyCondition = db => 
            Object.values(db.datasets)
            .filter(ds => g.isPromise(ds.data))
            .length > 0;

        super.promisifyConversion = db => 
            Promise.all(db.datasets.map(ds => ds.data))
            .then(datas => {
                for(let i in db.datasets) 
                    db.datasets[i].data = datas[i];
                return db;
            });

        let funcsToAttach = [
            'filter', 'map', 
            'group', 'sort', 'reduce', 
            'print', 'merge', 'import'
        ]

        this.addDatasets = this.then(db => db.addDatasets(obj));

        for(let funcName of funcsToAttach) 
            this[funcName] = 
                (...args) => this.then(db => db.callOnDs(funcName, ...args))    

    }

    // TODO: Close all connector connections
    execute (finalMapper) {
        
        if (finalMapper) {
            let param = parser.parameters(finalMapper)[0];
            finalMapper = g.noUndefinedForFunc(finalMapper);    
            finalMapper = db => db.getDataset(param).data.map(finalMapper);
        }

        return super.execute(finalMapper);

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

$$.connector = connector;
$$.idb = (storeName, dbName) => new connectorIdb(storeName, dbName);
