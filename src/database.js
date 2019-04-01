import * as g from './general.js';
import { dataset } from './dataset.js';
import { parser } from './parser.js';
import { dbConnector } from './dbConnector.js';
import { joiner } from './joiner.js';
import { hashBuckets } from './hashBuckets.js';
import { quickSort } from './sorts.js';
import { aggregator } from './aggregator.js';
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

    getDatasets(key) {

        if (g.isFunction(key)) 
            key = new parser.parameters(key);

        if (g.isString(key))
            key = [key];

        let foundDss = this
            .datasets
            .filter(ds => key.some(k => ds.key == k));

        if (foundDss.length == 0) 
            throw `No datasets found with passed keys (${key.join(',')})`;

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
        for (let func of dsFuncs) {

            let conAlias = parser.parameters(func.val)[0];
            let dsName = func.val();

            if (!g.isString(dsName))
                throw `
                    ${ds.key} did not return a string.  It should 
                    return the name of a dataset in ${conAlias}.
                `;
                     
            let getter = 
                this.dbConnectors[conAlias]
                .dsGetter(dsName);

            this.addSource(func.key, getter);

        }

        return this;

    }

    filter (func) { 
        let ds = this.getDataset(func)
        ds.call('filter', func);
        return this;
    }

    map (func) {    
        let ds = this.getDataset(func);    
        ds.call('map', func);
        return this;
    }

    join (
        newKey,
        joinType, // "inner", "left", "right", "full"
        matchingLogic, // (f,j) => [f.col1 == j.col1, f.col2 < j.col2],
        algorithm = "default" // "default", "hash", "loop"
    ) {

        let keys = new parser.parameters(matchingLogic);
        let fromDs = this.getDataset(keys[0]);
        let joinDs = this.getDataset(keys[1]);

        let joinedRows = 
            new joiner (fromDs, joinDs, joinType)
            .executeJoin(matchingLogic, algorithm);

        this.addSource(newKey, joinedRows);

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
        let ds = this.getDataset(orderedValuesSelector);
        ds.call(quickSort, orderedValuesSelector);
        return this;
    } 

    fold (outerFunc) {
        let ds = this.getDataset(outerFunc);
        ds.call(aggregator.runEmulators, outerFunc);
        // Ungrouped aggregates will return a naked object.
        // So instead we return a single row array. 
        if (!Array.isArray(ds.data))
            ds.data = [ds.data];
        return this;
    }

    // Got rid of external db printing, at least for now
    print (func, target, caption) {
        let ds = this.getDataset(func);
        let rows = ds.callWithoutModify('map', func);
        prn(target, rows, caption);
        return this;
    }

    merge (
        targetIdentityKey, 
        source, // mapper function or maybe even direct array of objects  
        allowDelete = false
    ) {

        let target = this.getDataset(targetIdentityKey);

        let sourceArray = 
            g.isFunction(source) ? this.getDataset(source).callWithoutModify('map', source)
            : source instanceof dataset ? source.data
            : Array.isArray(source) ? source
            : null; 

        if (!Array.isArray(sourceArray))
            throw 'parameter "source" failed to convert to an array.';

        let incomingBuckets = 
            new hashBuckets(targetIdentityKey)
            .addItems(sourceArray);
        
        for (let t = target.data.length - 1; t >= 0; t--) {

            let sourceRow = 
                incomingBuckets.getBucketFirstItem(
                    target.data[t], 
                    targetIdentityKey,
                    true 
                );

            if (sourceRow)
                target.data[t] = sourceRow;

            //else if (allowDelete) // target but no source
                //target.data.splice(t, 1);

        }

        let remainingItems = // source but no target
            incomingBuckets.getBuckets()
            .map(bucket => bucket[0]);

        for(let item of remainingItems)  
            target.data.push(item);

        return this;

    }

    /*
        else {

            let externalDb = this.externalDbs[new g.parser(target).parameters[0]];

            if (externalDb.dbType == 'idb') 
                
                // Why did I (psw) have to wrap in pretend promise to work?
                pretendPromise.all([mc]) 
                .then(obj => {
                    let mapped = obj[0];
                    mergeIntoIdb(externalDb.database, target(), mapped, identityKey, action);
                });

        }
    */

    /*
        oneQuery.mergeAction = Object.freeze({
            nothing: null,
            upsert: 'upsert',
            remove: 'remove'
        })
    */

}
