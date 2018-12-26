import * as general from "./general.js";


export class hashBuckets {
    
    constructor (
        hashKeySelector
    ) {
        this.mapper = new Map();
        this.hashKeySelector = hashKeySelector;
    }

    addItems(items) {
        for(let item of items)  
            this.addItem(item);
        return this;
    }

    addItem(item) {

        let objectKey = this.hashKeySelector(item);
        let stringKey = general.stringifyObject(objectKey);

        if (!this.mapper.has(stringKey)) 
            this.mapper.set(stringKey, [item]);
        else 
            this.mapper.get(stringKey).push(item);

        return this;

    }

    getBucket(
        objectToHash, 
        hashKeySelector,
        remove = false
    ) {

        let objectKey = hashKeySelector(objectToHash);
        let stringKey = general.stringifyObject(objectKey);

        let value = this.mapper.get(stringKey);

        if (remove) 
            this.mapper.delete(stringKey);

        return value;

    }

    getBucketFirstItem (
        objectToHash,
        hashKeySelector,
        remove = false
    ) {

        let bucket = 
            this.getBucket(
                objectToHash,
                hashKeySelector,
                remove
            );

        if (!bucket || bucket.length == 0)
            return null;

        return bucket[0];

    }

    getKeys() {
        return Array.from(this.mapper.keys());
    }

    getBuckets() {
        return Array.from(this.mapper.values());
    }

}

/*
export class hashBuckets {
    
    constructor (
        hashKeySelector
    ) {
        this.mapper = new Map();
        this.hashKeySelector = hashKeySelector;
    }

    addItems(items) {
        for(let item of items)  
            this.addItem(item);
        return this;
    }

    addItem(item) {

        let objectKey = this.hashKeySelector(item);
        let stringKey = general.stringifyObject(objectKey);

        if (this.mapper[stringKey] == undefined) 
            this.mapper[stringKey] = [item];
        else 
            this.mapper[stringKey].push(item);

        return this;

    }

    getBucket(
        objectToHash, 
        hashKeySelector,
        remove = false
    ) {

        let objectKey = hashKeySelector(objectToHash);
        let stringKey = general.stringifyObject(objectKey);

        let value = this.mapper[stringKey];

        if (remove) 
            this.mapper[stringKey] = undefined;

        return value;

    }

    getBucketFirstItem (
        objectToHash,
        hashKeySelector,
        remove = false
    ) {

        let bucket = 
            this.getBucket(
                objectToHash,
                hashKeySelector,
                remove
            );

        if (!bucket || bucket.length == 0)
            return null;

        return bucket[0];

    }

    getKeys() {
        return Object.keys(this.mapper);
    }

    getBuckets() {
        return Object.values(this.mapper);
    }

}
*/
