import * as g from './general.js';
import { dataset } from './dataset.js';
import { parser } from './parser.js';
import { dbConnector } from './dbConnector.js';
import { dsGetter } from './dsGetter';
import { thenRemoveUndefinedKeys } from './mapper.js';
import { joiner } from './joiner.js';
import { hashBuckets } from './hashBuckets.js';
import { quickSort } from './sorts.js';
import { runEmulators } from './reducer.js';
import { merger } from './merger.js';
import { print as prn } from './visualizer/printer.js';

export class database {

    constructor() {
        this.datasets = []; 
        this.dbConnectors = {};
    }

    getDataset(key) {
        let dss = this.getDatasets(key);
        if (dss.length > 1)
            throw `more than one dataset matching ${key} was found.`
        return dss[0];
    }

    getDatasets(key, errorIfNotFound) {

        if (g.isFunction(key)) 
            key = new parser.parameters(key);

        if (g.isString(key))
            key = [key];

        let foundDss = 
            this.datasets
            .filter(ds => key.some(k => ds.key == k));

        if (errorIfNotFound && foundDss.length != key.length) 
            throw   `One of the keys passed is not a dataset.  ` + 
                    `The keys passed are: (${key.join(',')})`;

        return foundDss;

    }

    addSource (key, data) { 
        this.datasets.push(new dataset(key, data));
        return this;
    }    

    removeSource (key) {

        for (let i in this.datasets) {
            
            let ds = this.datasets[i];
            
            if (ds.key == key) {
                this.datasets.splice(i, 1);
                return this;
            }

        }

        return this;

    }

    // parameter should be a dsConnector alias
    // value should be a dataset name (string)
    makeDsGetter(func) {

        let conAlias = parser.parameters(func)[0];
        let dsName = func();

        if (!g.isString(dsName))
            throw `
                ${ds.key} did not return a string.  It should 
                return the name of a dataset in ${conAlias}.
            `;
                 
        return this.dbConnectors[conAlias]
            .dsGetter(dsName);

    }

    addSources (obj) { 

        let items = Object.keys(obj).map(k => ({ key: k, val: obj[k]}));
        let dbCons = items.filter(i => i.val instanceof dbConnector);
        let dsFuncs = items.filter(i => g.isFunction(i.val));
        let datasets = items.filter(i => !(i.val instanceof dbConnector) && !g.isFunction(i.val));

        for (let con of dbCons)
            this.dbConnectors[con.key] = con.val;

        for (let ds of datasets) 
            this.addSource(ds.key, ds.val);

        // A function in addSources should only ever have the form:
        //    dbConnectorAlias => 'datasetName';            
        for (let dsFunc of dsFuncs) 
            this.addSource(
                dsFunc.key, 
                this.makeDsGetter(dsFunc.val)
            );

        return this;

    }

    filter (func) { 
        let ds = this.getDataset(func)
        ds.call('filter', func);
        return this;
    }

    map (func) {    
        let ds = this.getDataset(func);    
        ds.call('map', thenRemoveUndefinedKeys(func));
        return this;
    }

    join (
        newKey,
        options, // inner, left, right, full, default, loop, hash
        matchingLogic, // (f,j) => f.col1 == j.col1 && f.col2 < j.col2
        mapper
    ) {

        // You can tell whether the user desires to bypass newKey or
        // options based on place of the first parameter that is not
        // a string.  Shift the arguments accordingly and call 'join' 
        // again.

        // shift parameters by two
        if (!g.isString(newKey))
            return this.join(
                parser.parameters(newKey)[0], 
                'inner hash',
                newKey, // really matchingLogic
                options // really mapper
            );        

        // shift parameters by one
        if (!g.isString(options)) 
            return this.join(
                parser.parameters(options)[0], 
                newKey, // really options
                options, // really matchingLogic
                matchingLogic // really mapper
            );

        let keys = 
            g.isFunction(matchingLogic)
            ? parser.parameters(matchingLogic)
            : [
                 parser.parameters(matchingLogic[0]),
                 parser.parameters(matchingLogic[1])
              ];

        let fromDs = this.getDataset(keys[0]);
        let joinDs = this.getDataset(keys[1]);

        let joinedRows = 
            new joiner (fromDs, joinDs, options)
            .execute(matchingLogic, mapper);

        if (!this.getDataset(newKey))
            this.addSource(newKey, joinedRows);
        else 
            this.getDataset(newKey).data = joinedRows;

        return this;

    }

    group (groupKeySelector) {
    
        let ds = this.getDataset(groupKeySelector);

        let buckets = 
            new hashBuckets(groupKeySelector)
            .addItems(ds.data)
            .getBuckets();

        ds.data = buckets;

        return this;

    }

    sort (orderedValuesSelector) {

        let ds = this.getDatasets(orderedValuesSelector)[0];

        ds.call(
            parser.parameters(orderedValuesSelector).length > 1 
                ? 'sort' 
                : quickSort, 
            orderedValuesSelector
        );

        return this;

    } 

    reduce (outerFunc) {
        let ds = this.getDataset(outerFunc);
        ds.call(runEmulators, outerFunc);
        // 'runEmulators' returns an object, reduced from an array.   
        // But to keep allowing chaining of methods, we still need 
        // to return an array, not an object.
        if (!Array.isArray(ds.data))
            ds.data = [ds.data];
        return this;
    }

    print (func, target, caption) {

        let ds = this.getDataset(func);

        // if dataset is an external dataset (is a dsGetter),
        // then it is a promise, so print inside 'then'.
        if (ds.data instanceof dsGetter) {
            ds.callWithoutModify('map', func)
                .then(rows => prn(target, rows, caption));
            return this;
        }

        let rows = ds.callWithoutModify('map', func);
        prn(target, rows, caption);
        return this;

    }

    merge (
        type, // update, insert, delete, upsert, full, or [] of 4 bools
        targetIdentityKey, 
        sourceIdentityKey  
    ) {

        // if the second argument is a function that fetches
        // an external dsGetter, run merge on that, not here.
        let arg2Alias = parser.parameters(arguments[1])[0];
        if(Object.keys(this.dbConnectors).includes(arg2Alias)) 
            return this.mergeExternal(...arguments);    

        let target = this.getDataset(targetIdentityKey);
        let source = this.getDataset(sourceIdentityKey); 

console.log(
    `merge: ` + 
    `source is ${g.isPromise(source.data) ? '' : 'not'} a promise.  ` + 
    `target is ${g.isPromise(target.data) ? '' : 'not'} a promise.`
);

        target.data = merger(
            type, 
            target.data, 
            source.data, 
            targetIdentityKey, 
            sourceIdentityKey
        );

        return this;

    }
    
    mergeExternal (
        type, // update, insert, delete, upsert, full, or [] of 4 bools
        dsGetterFunc,
        targetIdentityKey, 
        sourceIdentityKey  
    ) {

        let dsGetter = this.makeDsGetter(dsGetterFunc);

        let source = 
            this.getDataset(sourceIdentityKey)
            .callWithoutModify('map', x => x); // just get the raw data

        dsGetter.merge(type, targetIdentityKey, sourceIdentityKey, source);
        return this;

    }

}
