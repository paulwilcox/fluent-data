import * as g from "./general.js";

// This is written to allow two or more co-buckets.  But 
// I think most usages will only require a pair.  So 
// if it's too complicated and usage only ever requires
// a pair, not a big deal to refactor to pair specific
// implementation if it would simplify things.
export default class extends Map {
    
    constructor ( stringify = true ) {
        super();
        this.stringify = stringify;
        this.cobucketIndicies = new Set();
    }

    add(cobucketIX, hashFunc, distinctBehavior, ...items) {

        this.cobucketIndicies.add(cobucketIX);

        for (let item of items) {
             
            let key = this.hashify(hashFunc, item);

            if (!this.has(key)) {
                let cobucket = [];
                cobucket[cobucketIX] = [item];
                this.set(key, cobucket);
                continue;
            }

            if (!this.get(key)[cobucketIX])
                this.get(key)[cobucketIX] = [];

            switch(distinctBehavior) {
                case 'first': break;
                case 'last': this.get(key)[cobucketIX][0] = item; break;
                case 'distinct': throw 'distinct option passed but more than one records match.'
                default: this.get(key)[cobucketIX].push(item);
            }

        }

        return this;

    }

    * crossMap(func) {

        for (let bucketSet of this.values())  
        for (let item of this.crossMapBucketSet(bucketSet, func))
            yield item;
    }

    * crossMapBucketSet(bucketSet, func) {

        let cbIXs = [...this.cobucketIndicies];
        let crosses = [];
        let working = [];
    
        for (let row of bucketSet[cbIXs.shift()])
            crosses.push([row]);
    
        for (let cbIX of cbIXs) {
            let bucket = bucketSet[cbIX];
            for (let row of bucket)
            for (let cross of crosses) 
                working.push([...cross, row]);
            crosses = working;
            working = [];
        }
    
        for (let cross of crosses) {
            let mapped = func(...cross);
            if (mapped === undefined)
                continue;
            if (!Array.isArray(mapped)) {
                yield mapped;
                continue;
            }
            for(entry of mapped)
                if (entry !== undefined)
                    yield entry;
        }

    }

    hashify (hashFunc, obj) {
        return this.stringify 
            ? g.stringifyObject(hashFunc(obj))
            : hashFunc(obj);
    }

}

