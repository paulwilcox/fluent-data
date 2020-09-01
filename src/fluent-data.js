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

_.first = rowFunc =>
    data => {
        for (let row of data )
            if (rowFunc(row) !== undefined && rowFunc(row) !== null)
                return rowFunc(row);
        return null;
    }

_.last = rowFunc => 
    data => {
        for (let i = data.length - 1; i >= 0; i++)
            if (rowFunc(data[i]) !== undefined && rowFunc(data[i]) !== null)
                return rowFunc(data[i]);
        return null;
    }

_.sum = (rowFunc, options) => 
    data => {
        let agg = 0;
        for (let row of data) 
            agg += rowFunc(row);
        if (options && options.test) 
            agg = -agg;
        return agg;
    };

_.count = rowFunc => 
    data => {
        let agg = 0;
        for (let row of data) {
            let r = rowFunc(row)
            if (r !== undefined && r !== null)
                agg += 1;
        }
        return agg;
    };

_.avg = rowFunc => 
    data => {
        let s = _.sum(rowFunc)(data);
        let n = _.count(rowFunc)(data);
        return s / n;
    };

_.mad = rowFunc => 
    data => {

        let avg = _.avg(rowFunc)(data);
        let devs = [];

        for (let ix in data)
            devs[ix] = Math.abs(rowFunc(data[ix]) - avg);
    
        return _.avg(x => x)(devs);    

    };

_.cor = (rowFunc, options) => 
    data => {
    
        let xAvg = _.avg(v => rowFunc(v)[0])(data);
        let yAvg = _.avg(v => rowFunc(v)[1])(data);
        let n = _.count(v => rowFunc(v))(data);

        let diffs = [];
        for(let row of data) 
            diffs.push({ 
                xDiff: rowFunc(row)[0] - xAvg, 
                yDiff: rowFunc(row)[1] - yAvg
            });

        let xyDiff = _.sum(row => row.xDiff * row.yDiff)(diffs);
        let xDiffSq = _.sum(row => row.xDiff ** 2)(diffs);
        let yDiffSq = _.sum(row => row.yDiff ** 2)(diffs);

        let cor = xyDiff / (xDiffSq ** 0.5 * yDiffSq ** 0.5)
        let df = n - 2;
        let t =  g.studentsTfromCor(cor, n);
        let pVal = g.studentsTcdf(t, df);
            
        if (options === undefined)
            return cor;

        if (options.tails == 2)
            pVal *= 2;

        return { cor, pVal, n, df, t };
        
    };

_.regress = (ivSelector, dvSelector) => 
    data => {

        let ivKeys = Object.keys(ivSelector({}));
        let outerIvSelector = (row) => ivKeys.map(key => ivSelector(row)[key])

        let dvKeys = Object.keys(dvSelector({}));
        let outerDvSelector = (row) => dvSelector(row)[key];

        if (ivKeys.length == 0)
            throw `ivSelector must return an object with explicit keys defined.`
        if (dvKeys.length != 1)
            throw `dvSelector must return an object with exactly one key defined.`

        let matrix = $$(data)
            .matrix(row => [1, ...(outerIvSelector(row))])
            .setColNames(`dummy,${keys.join(',')}`);
        
        let vector = $$(dvSelector).matrix(row => outerDvSelector(row));
        let transposed = matrix.clone().transpose();
        
        let results = 
            transposed.clone()
            .multiply(matrix)
            .inverse()
            .multiply(transposed)
            .multiply(vector);
        
        return results.data; 

    }

_.round = (term, digits) => Math.round(term * 10 ** digits) / 10 ** digits

