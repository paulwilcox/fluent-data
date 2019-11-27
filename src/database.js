import * as g from './general.js';
import dataset from './dataset.js';
import parser from './parser.js';
import dbConnector from './dbConnector.js';
import dsGetter from './dsGetter';
import hashBuckets from './hashBuckets.js';
import { quickSort } from './sorts.js';
import { runEmulators } from './reducer.js';
import merger from './merger.js';
import { print as prn } from './visualizer/printer.js';

export default class {

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
        ds.call('map', g.noUndefinedForFunc(func));
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

    // TODO: Document new parameter order and console.log capability
    print (func, caption, target) {

        let ds = this.getDataset(func);

        let printer = rows => 
              target ? prn(target, rows, caption)
            : caption ? console.log(caption, rows) 
            : console.log(rows); 

        // if dataset is an external dataset (is a dsGetter),
        // then it is a promise, so print inside 'then'.
        if (ds.data instanceof dsGetter) {
            ds.callWithoutModify('map', func)
            .then(rows => { 
                if (!target && !caption) 
                    console.log(
                        `${ds.key} is a dsGetter that has not been ` +
                        `imported into the FluentDB instance`
                    ); 
                printer(rows);
            });
            return this;
        }

        let rows = ds.callWithoutModify('map', func);
        printer(rows);
        return this;

    }

    merge (...args) {
        
        // user did not pass a 'newKey'.  So make it the function parameter.
        if (g.isFunction(args[0]))
            args.unshift(parser.parameters(args[0])[0]);

        let [ newKey, matchingLogic, mapper, onDuplicate ] = args;

        let keys = parser.parameters(matchingLogic);
        let leftData = this.getDataset(keys[0]).data;
        let rightData = this.getDataset(keys[1]).data;

        let merged = merger(
            leftData, 
            rightData, 
            matchingLogic, 
            mapper, 
            onDuplicate
        );

        !this.getDataset(newKey)
            ? this.addSource(newKey, merged)
            : this.getDataset(newKey).data = merged;

        return this;

    }

}
