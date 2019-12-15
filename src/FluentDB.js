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

        super.promisifyCondition = db => { 

            // The final mapper in 'execute' will cause the 
            // thenable to return a non-database
            if(!(db instanceof database))
                return false;

            return 0 < 
                Object.values(db.datasets)
                .filter(ds => g.isPromise(ds))
                .length;

        }

        super.promisifyConversion = db => {
            let datasets = g.PromiseAllObjectEntries(db.datasets);
            return Promise.all([db,datasets])
                .then(obj => {
                    let [db,datasets] = obj;
                    db.datasets = datasets;
                    return db;
                });
        }

        this.addDatasets = obj => this.then(db => db.addDatasets(obj));

        let funcsToAttach = [
            'filter', 'map', 
            'group', 'sort', 'reduce', 
            'print', 'merge', 'import'
        ];

        for(let funcName of funcsToAttach) 
            this[funcName] = 
                (...args) => this.then(db => db.callOnDs(funcName, ...args)); 

    }

    // TODO: Close all connector connections
    execute (finalMapper) {
        
        if (finalMapper) {
            this.map(finalMapper);
            let param = parser.parameters(finalMapper)[0];
            return super.execute(db => db.datasets[param].data);
        }

        return super.execute();

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
