import dataset from './dataset.js';
import matrix from './matrix.js';
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

_.std = (rowFunc, isSample = false) => 
    data => {
        let m = _.avg(rowFunc)(data);
        let ssd = data.reduce((agg,row) => agg + Math.pow(rowFunc(row) - m,2), 0);
        let n = _.count(rowFunc)(data);
        if (isSample)
            n--;
        return Math.pow(ssd/n, 0.5);
    }

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

        // Output a selector of row properties that returns an array
        // and a set of labels (keys) that pertain to the array
        let processSelector = (selector) => {
            
            if (g.isString(selector)) {
                let keys = selector.split(',').map(key => key.trim());
                return [
                    keys,
                    (row) => keys.map(key => row[key])
                ];
            }

            let keys = Object.keys(selector({}));
            return [
                keys, 
                (row) => keys.map(key => selector(row)[key])
            ];

        }

        let [ ivKeys, outerIvSelector ] = processSelector(ivSelector);
        let [ dvKeys, outerDvSelector ] = processSelector(dvSelector);

        if (ivKeys.length == 0)
            throw `ivSelector must return an object with explicit keys defined.`
        if (dvKeys.length != 1)
            throw `dvSelector must return an object with exactly one key defined.`

        let ivs = 
            new matrix(data, row => [1, ...outerIvSelector(row)] )
            .setColNames(`dummy,${ivKeys.join(',')}`);
            
        let dvs = new matrix(data, row => outerDvSelector(row));
        let transposedIvs = ivs.clone().transpose();
        
        let coefficients = 
            transposedIvs.clone()
            .multiply(ivs)
            .inverse()
            .multiply(transposedIvs)
            .multiply(dvs)
            .data.map(row => row[0]);
        
        let estimates = [];
        for(let row of data)  {
            let actual = outerDvSelector(row);
            actual = actual.length == 1 ? actual[0] : undefined;
            estimates.push({
                estimate: 
                    outerIvSelector(row)
                    .map((iv,ivIx) => iv * coefficients[ivIx + 1])
                    .reduce((a,b) => a + b, 0)
                    + coefficients[0], // intercept
                actual
            });
        }

        // Calculate the F statistic
        // en.wikipedia.org/wiki/F-test (Regression Problems | p1 and p2 include the intercept)
        let mean = _.avg(row => row.actual)(estimates);
        let n = _.count(row => row.actual)(estimates);

        let ssComplex = _.sum(row => Math.pow(row.estimate - row.actual, 2))(estimates);
        let ssSimple = _.sum(row => Math.pow(row.actual - mean, 2))(estimates);
        let paramsComplex = coefficients.length;
        let paramsSimple = 1;

        let F = ((ssSimple - ssComplex) / (paramsComplex - paramsSimple)) / 
                (ssComplex/(n-paramsComplex))

        return {
            coefficients,
            F,
            estimates
        }; 

    }

_.round = (term, digits) => Math.round(term * 10 ** digits) / 10 ** digits

