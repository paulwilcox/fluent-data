import * as g from "./general.js";

export default class extends Map {
    
    constructor (
        hashKeySelector,
        stringify = true
    ) {
        super();
        this.hashKeySelector = stringify 
            ? item => g.stringifyObject(hashKeySelector(item)) 
            : hashKeySelector;
    }

    addItems(items) {
        for(let item of items) 
            this.addItem(item);
        return this;
    }

    addItem(item) {
        let key = this.hashKeySelector(item);
        if(!this.has(key))
            this.set(key, []);
        this.get(key).push(item)
        return this;
    }

    getBucket(
        objectToHash, 
        hashKeySelector,
        stringify
    ) {
        let key = stringify
            ? g.stringifyObject(hashKeySelector(objectToHash))
            : hashKeySelector(objectToHash);
        return this.mapper.get(key);
    }

    getBuckets() {
        return Array.from(this.mapper.values());
    }

    * crossMap(incomingRows, mapper) {
        for (let incomingRow of incomingRows)
            for(let outputRow of crossMapRow(incomingRow, mapper))
                yield outputRow;
    }

    * crossMapRow(incomingRow, hashKeySelector, stringify, mapper) {
                
        let existingRows = this.getBucket(incomingRow, hashKeySelector, stringify);

        if (existingRows === undefined)
            existingRows = [undefined];

        for(let existingRow of existingRows) {

            let mapped = mapper(existingRow, incomingRow);

            if (Array.isArray(mapped)) 
                for (let entry of mapped) 
                    if (entry !== undefined)
                        yield entry;
            else if (mapped !== undefined)
                yield mapped;

        }

    }
    
}

