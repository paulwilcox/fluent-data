import * as g from './general.js';
import { dataset } from './dataset.js';
import { parser } from './parser.js';
import { dbConnector } from './dbConnector.js';
import { joiner } from './joiner.js';

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

        return this
            .datasets
            .filter(ds => key.some(k => ds.key == k));

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
        ds.apply('filter', func);
        return this;
    }

    map (func) {    
        let ds = this.getDataset(func);
        ds.apply('map', func);
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

}


// TODO: I don't think this is what is utilized.  There
// is an equivalent on oneQuery.js and I think that's
// what's being utilized.
database.idb = dbName => new dbConnectorIdb(dbName);

