import * as general from "./general.js";

// Works like Map, except that it uses Sets as keys.
export class database extends Array {

    addDatasets(...args) {

        if (args.length == 1)
            this.addDatasetsByObject(args[0]);
        else if (args.length == 2) 
            this.addDataset(args[0], args[1]);
        else if (args.length == 3) 
            this.addDataset(args[0], args[1], args[2]);
        else 
            throw "'addDatasets' expects 1 to 3 parameters."

        return this;

    }
    
    addDatasetsByObject(obj) {

        let keys = Object.keys(obj);
        let datas = Object.values(obj);

        for(let i in keys) {
            let key = keys[i];
            let data = datas[i];
            this.addDataset([key], data);
        }

    }

    // newKey is optional
	addDataset(key, data, newKey) {

	    let incoming = {
            key: new Set(key),
            data: data
        }

        let keyFound = false;

        for(let dataset of this) 
            if (general.setEquals(dataset.key, incoming.key)) {
                dataset.data = incoming.data;
                keyFound = true;
            }
            
	    if (!keyFound)
		    this.push(incoming);

        if (newKey)
            this.reKey(key, newKey);

    } 

    get(key) {

        key = new Set(key);

	    for (let dataset of this) 
            if (general.isSubsetOf(key, dataset.key)) 
                return dataset.data;
            
	    return undefined;

	}

    remove(key) {

        key = new Set(key);

        let ix = 
            this
            .findIndex(dataset => general.setEquals(dataset.key, key));
        
        if (ix != -1)
            this.splice(ix, 1);

        return this;

    }

    reKey (oldPartialKey, newKey) {

        let oldKey = this.getFullKey(oldPartialKey);

        let dataset = 
            this
            .filter(dataset => general.setEquals(dataset.key, oldKey))
            [0];

        dataset.key = new Set()
        dataset.key.add(newKey);

    }

    getFullKey (partialKey) {

        if (general.isString(partialKey))
            partialKey = new Set(partialKey);

        return this
            .map(dataset => dataset.key)
            .find(fullKey => general.isSubsetOf(partialKey, fullKey));
    }

}