import * as general from "./general.js";

// Works like Map, except that it uses Sets as keys.
export class storesBin {

	constructor() {
        this.storeInfos = [];
	}

    set(...args) {

        if (args.length == 1)
            this.setByObject(args[0]);
        else if (args.length == 2) 
            this.setByKey(args[0], args[1]);
        else if (args.length == 3) 
            this.setByKey(args[0], args[1], args[2]);
        else 
            throw "'set' expects 1 to 3 parameters."

        return this;

    }
    
    setByObject(obj) {

        let keys = Object.keys(obj);
        let stores = Object.values(obj);

        for(let i in keys) {
            let key = keys[i];
            let store = stores[i];
            this.setByKey([key], store);
        }

    }

    // newKey is optional
	setByKey(key, store, newKey) {

	    let storeInfo = {
            key: new Set(key),
            store: store
        }

        let keyFound = false;

        for(let targetStoreInfo of this.storeInfos) 
            if (this.setEquals(targetStoreInfo.key, storeInfo.key)) {
                targetStoreInfo.store = storeInfo.store;
                keyFound = true;
            }
            
	    if (!keyFound)
		    this.storeInfos.push(storeInfo);

        if (newKey)
            this.reKey(key, newKey);

    } 

    get(key) {

        key = new Set(key);

	    for (let storeInfo of this.storeInfos) 
            if (this.isSubsetOf(key, storeInfo.key)) 
                return storeInfo.store;
            
	    return undefined;

	}

    remove(key) {

        key = new Set(key);

        let ix = 
            this.storeInfos
            .findIndex(storeInfo => this.setEquals(storeInfo.key, key));
        
        if (ix != -1)
            this.storeInfos.splice(ix, 1);

        return this;

    }

    reKey = (oldPartialKey, newKey) => {

        let oldKey = this.getFullKey(oldPartialKey);

        let store = 
            this.storeInfos
            .filter(storeInfo => this.setEquals(storeInfo.key, oldKey))
            [0];

        store.key = new Set()
        store.key.add(newKey);

    }

    getFullKey = partialKey => {

        if (general.isString(partialKey))
            partialKey = new Set(partialKey);

        return this.storeInfos
            .map(storeInfo => storeInfo.key)
            .find(fullKey => this.isSubsetOf(partialKey, fullKey));
    }

    isSubsetOf = (sub, sup) => 
        this.setEquals (
            new Set([...sub].filter(x => [...sup].indexOf(x) >= 0)), // intersection
            sub
        );

    // Max Leizerovich: stackoverflow.com/questions/
    //   31128855/comparing-ecma6-sets-for-equality
    setEquals = (a, b) =>
        a.size === b.size 
        && [...a].every(value => b.has(value));

}