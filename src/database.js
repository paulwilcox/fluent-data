/*

    phi.report (φ.report)
    phi.ninja (φ.ninja)
    philos.us
    philososaur.us

*/

import * as g from './general.js';
import { dataset } from './dataset.js';
import { parser } from './parser.js';
import { dbConnector } from './dbConnector.js';

export class database {

    constructor() {
        this.datasets = []; 
        this.dbConnectors = {};
    }

    getDs(key) {
        if (g.isFunction(key)) 
            key = new parser.parameters(key);
        return this.datasets.find(ds => ds.keyMatch(key));
    }

    addSource (key, data) { 
        this.datasets.push(new dataset(key, data));
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
        let ds = this.getDs(func)
        ds.apply('filter', func);
        return this;
    }

    map (func) { 
        
        let ds = this.getDs(func);
        ds.apply('map', func);
        
               
        //But I don't want to do this for every function

        if (g.isPromise(ds.data))

            return Promise.all([this, ds.key, ds.data])
                .then(duo => {
                    let db = duo[0];
                    let key = duo[1];
                    let data = duo[2];
                    db.getDs(key).data = data;
                    return db;
                });

        

       return this;

    }    
    
}


database.idb = dbName => new dbConnectorIdb(dbName);