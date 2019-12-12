import * as g from './general.js';

// 'buckle' signifies tuple with buckets as items.  Usage will 
// probably only be pairs though, so in the future if desired 
// you can simplify to simply allow pairs, not more than that.
export default class extends Map {
    
    constructor (stringify = true) {
        super();
        this.stringify = stringify;
        this.bucketIndicies = new Set();
    }

    add(bucketIndex, hashFunc, distinctBehavior, ...items) {

        this.bucketIndicies.add(bucketIndex);

        for (let item of items) {
             
            let key = this.hashify(hashFunc, item);

            if (!this.has(key)) {
                let buckle = [];
                buckle[bucketIndex] = [item];
                this.set(key, buckle);
                continue;
            }

            if (!this.get(key)[bucketIndex])
                this.get(key)[bucketIndex] = [];

            switch(distinctBehavior) {
                case 'first': break;
                case 'last': this.get(key)[bucketIndex][0] = item; break;
                case 'dist': throw 'distinct option passed but more than one records match.'
                default: this.get(key)[bucketIndex].push(item);
            }

        }

        return this;

    }

    * crossMap(func) {

        for (let bucketSet of this.values())  
        for (let item of this.crossMapBuckle(bucketSet, func))
            yield item;
    }

    * crossMapBuckle(bucketSet, func) {

        let isFirstBucket = true;
        let crosses = [[]]; // but when overwriting, just do [].
        let working = [];
                  
        for (let bucketIX of [...this.bucketIndicies]) {

            let bucket = bucketSet[bucketIX] || [undefined];

            for (let cross of crosses) 
            for (let row of bucket) 
                isFirstBucket 
                    ? working.push([row]) // at this point cross is just a dummy '[]'
                    : working.push([...cross, row]);

            crosses = working;
            working = [];
            isFirstBucket = false;

        }

        for (let cross of crosses) {
            let mapped = func(...cross);
            if (mapped === undefined)
                continue;
            if (!Array.isArray(mapped)) {
                yield mapped;
                continue;
            }
            for(let entry of mapped)
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

