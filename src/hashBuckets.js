import * as g from "./general.js";

export default class extends Map {
    
    constructor (
        hashKeySelector,
        distinct = false
    ) {
        super();
        this.distinct = distinct;
        this.hashKeySelector = hashKeySelector;
    }  
 
    addItems(items) {
        for(let item of items)
            this.addItem(item);
        return this;
    }

    addItem(item) {

        let key = this.hashKeySelector(item);
        if (!g.isString(key))
            key = g.stringifyObject(key);

        if (this.distinct) {
            this.set(key, [item]);
            return this;
        }

        if(!this.has(key))
            this.set(key, []);

        this.get(key).push(item);

        return this;

    }

    getBucket(
        objectToHash, 
        hashKeySelector
    ) {
        let key = hashKeySelector(objectToHash);
        if (!g.isString(key))
            key = g.stringifyObject(key);
        return this.get(key);
    }

    getBuckets() {
        return Array.from(this.values());
    }

    * crossMapRow(incomingRow, hashKeySelector, mapper) {

        let existingRows = this.getBucket(incomingRow, hashKeySelector);                

        if (existingRows === undefined)
            existingRows = [undefined];

        for(let existingRow of existingRows) {

            let mapped = mapper(existingRow, incomingRow);

            if (Array.isArray(mapped)) {
                for (let entry of mapped) 
                    if (entry !== undefined) 
                        yield entry;
            }
                        
            else if (mapped !== undefined) 
                yield mapped;

        }

    }
    
}
