import { reducer, runEmulators } from './reducer.js';
import database from './database.js';
import dataset from './dataset.js';
import { mergeMethod } from './mergeTools.js';
import * as g from './general.js';

export default function _(obj) { 
    return obj instanceof dataset ? obj
        : g.isIterable(obj) ? new dataset(obj)
        : new database().addDatasets(obj); 
}

_.fromJson = function(json) {
    
    let db = new database();

    let populateDb = pds => {
        for(let key of Object.keys(pds)) 
            db.datasets[key] = new dataset(
                pds[key].data, 
                pds[key].groupLevel
            );
    }

    if (json.constructor.name == 'Response') 
        return json.json().then(protoDatasets => {
            populateDb(protoDatasets);
            return db;
        });

    let protoDatasets = g.isString(json) ? JSON.parse(json) : json;
    populateDb(protoDatasets);
    return db;

}

_.mergeMethod = mergeMethod;

_.reducer = reducer;
_.runEmulators = runEmulators;

_.first = reducer(v => v, array => array.reduce((a,b) => a || b));
_.last = reducer(v => v, array => array.reduce((a,b) => b || a));
_.sum = reducer(v => v, array => array.reduce((a,b) => a + b));
_.count = reducer(v => v, array => array.reduce((a,b) => a + 1, 0));

_.avg = reducer(v => v, array => {

    let agg = runEmulators(array, val => ({
        sum: _.sum(val), 
        count: _.count(val)     
    }));

    return agg.sum / agg.count

});

_.mad = reducer(v => v, array => {

    let agg = runEmulators(array, val => _.avg(val));

    for (let ix in array)
        array[ix] = Math.abs(array[ix] - agg);

    return runEmulators(array, val => _.avg(val));
    
});

_.cor = reducer((x,y) => ({ x, y }), data => {

    let agg = runEmulators(data, row => ({ 
        xAvg: _.avg(row.x), 
        yAvg: _.avg(row.y) 
    }));

    for(let ix in data) 
        data[ix] = { 
            xDiff: data[ix].x - agg.xAvg, 
            yDiff: data[ix].y - agg.yAvg
        };

    agg = runEmulators(data, row => ({
        xyDiff: _.sum(row.xDiff * row.yDiff), 
        xDiffSq: _.sum(row.xDiff ** 2),
        yDiffSq: _.sum(row.yDiff ** 2)    
    }));

    return agg.xyDiff / (agg.xDiffSq ** 0.5 * agg.yDiffSq ** 0.5);
    
});

_.round = (term, digits) => Math.round(term * 10 ** digits) / 10 ** digits

