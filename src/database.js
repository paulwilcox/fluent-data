import * as g from './general.js';
import dataset from './dataset.js';
import parser from './parser.js';

export default class {

    constructor() {
        this.datasets = []; 
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

    addSources (obj) { 
        for (let entry of Object.entries(obj)) 
            this.addSource(entry[0], entry[1]);
        return this;
    }

    filter (func) { 
        this.getDataset(func).filter(func);
        return this;
    }

    map (func) {    
        this.getDataset(func).map(func);
        return this;
    }

    group (func) {
        this.getDataset(groupKeySelector).group(func);
        return this;
    }

    sort (func) {
        let ds = this.getDatasets(func)[0];
        ds.sort(func);
        return this;
    } 

    reduce (func) {
        this.getDataset(func).reduce(func);
        return this;
    }

    print (func, caption, target) {
        this.getDataset(func).print(func, caption, target);
        return this;
    }

    merge (func, mapper, onDuplicate) {        
        let datasets = this.getDatasets(func);
        datasets[0].merge(
            datasets[1].data,
            func,
            mapper, 
            onDuplicate
        );
        return this;
    }

}
