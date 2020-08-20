import { reducer, runEmulators } from './reducer.js';
import dataset from './dataset.js';
import { mergeMethod } from './mergeTools.js';
import * as g from './general.js';

export default function _(obj) { 
    if (!g.isIterable(obj))
        throw 'Object instantiating fluent_data must be iterable';
    return obj instanceof dataset ? obj : new dataset(obj);
}

_.fromJson = function(json) {

    let ds = new dataset();

    if (json.constructor.name == 'Response') 
        return json.json().then(parsed => {
            ds.data = parsed.data;
            ds.groupLevel = parsed.groupLevel;
            return ds;
        });

    let parsed = g.isString(json) ? JSON.parse(json) : json;
    ds.data = parsed.data;
    ds.groupLevel = parsed.groupLevel;

    return ds;

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
        yAvg: _.avg(row.y),
        n: _.count(row) 
    }));

    let n = agg.n;

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

    let cor = agg.xyDiff / (agg.xDiffSq ** 0.5 * agg.yDiffSq ** 0.5)
    let df = n - 2;
    let t =  g.studentsTfromCor(cor, n);

    return {
        cor: cor,
        pVal: g.studentsTcdf(t, df), 
        n: n,
        df: df,
        t: t
    };
    
});

_.round = (term, digits) => Math.round(term * 10 ** digits) / 10 ** digits

