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

        if (key instanceof Set)
            key = Array.from(key);

        return this
            .datasets
            .filter(ds => key.some(k => ds.keyMatch(k)));

    }

    addSource (key, data) { 
        this.datasets.push(new dataset(key, data));
        return this;
    }    

    removeSource (key, matchExactKey = true) {

        for (let i in this.datasets) {
            
            let ds = this.datasets[i];
            
            if (ds.keyMatch(key, true)) {
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

    dual(func) {
        let pars = parser.parameters(func);
        let ds1 = this.getDataset(pars[0]);
        let ds2 = this.getDataset(pars[1]);
        console.log({
            ds1, 
            ds2,
            ds1row1: ds1.data[0],
            ds2row1: ds2.data[0] 
        });
        return this;
    }

    // accepts multiple join commands 
    join (...commands) {

        for (let command of commands) {
                
            if(typeof command == 'function')
                command = { 
                    joinType: 'inner', 
                    matchingLogic: command,
                    algorithm: 'default'
                };

            this.joinRecords(
                command.matchingLogic, 
                command.joinType
            );

        }

        return this;

    }

    // works on a particular join command
    joinRecords (
        matchingLogic, // (f,j) => [f.col1 == j.col1, f.col2 < j.col2],
        joinType // "inner", "left", "right", "full"
    ) {

        let fromKeys = new parser.parameters(matchingLogic);
        let joinKey = fromKeys.pop();

        let fromDs = this.getDataset(fromKeys);
        let joinDs = this.getDataset(joinKey);

        let resultKey = new Set(fromDs.key);
        resultKey.add(joinDs.key);

        let resultData = 
            new joiner (
                fromDs.key,   joinDs.key,
                fromDs,       joinDs, 
                joinType
            )
            .executeJoin(matchingLogic);

        this.addSource(resultKey, resultData);

        this.removeSource(fromDs.key);
        this.removeSource(joinDs.key);

        return this;

    }

}


// TODO: I don't think this is what is utilized.  There
// is an equivalent on oneQuery.js and I think that's
// what's being utilized.
database.idb = dbName => new dbConnectorIdb(dbName);

