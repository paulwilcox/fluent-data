import * as g from './general.js';
import { quickSort } from './sorts.js';
import Matrix from './matrix.js';
import parser from './parser.js';
import { hashMerge, loopMerge } from './mergeTools.js';
import grouping from './grouping.js';
import hashBuckets from './hashBuckets.js';

export default class dataset extends grouping {

    constructor(data) {
        super(null);
        this.data = data;
    }

    *[Symbol.iterator]() { 
        yield* this.data;
    }

    map (func) {    
        this.apply(function* (data) {
            for(let row of data)
                yield g.noUndefined(func(row));
        });
        return this;
    }

    filter (func) { 
        this.apply(function* (data) {
            for(let row of data)
                if(func(row))
                    yield row;
        })
        return this;
    }

    sort (sorter) {
        let _sorter = parser.parameters(sorter).length > 1 
            ? data => quickSort(data, sorter, false)
            : data => quickSort(data, sorter, true);
        this.apply(_sorter);
        return this;
    } 

    reduce (obj, ungroup = true) {

        let isNaked = Object.keys(obj).length == 0;

        // wrap result in array to bring back to original nesting level
        this.apply(data => {
            let agg = {};
            if (isNaked)
                return [obj(data)];
            for(let [key,reducer] of Object.entries(obj)) 
                agg[key] = reducer(data);
            return [agg]; 
        });

        if (ungroup) 
            this.ungroup();

        return this;

    }

    distinct (hashKeySelector, sorter) {

        hashKeySelector = hashKeySelector || (x => x);
        
        let getFirstBucketItem = sorter
            ? (bucket) => new dataset(bucket).sort(sorter).data.next().value
            : (bucket) => bucket[0];
            

        this.apply(data => 
            new hashBuckets(hashKeySelector)
                .addItems(data)
                .getBuckets()
                .map(getFirstBucketItem)
        );

        return this;

    }

    merge (
        rightData, 
        matcher, 
        mapper, 
        {
            singular, 
            leftSingular,
            rightSingular,
            hasher,
            leftHasher,
            rightHasher,
            algo
        } = {}
    ) {

        // initializations

            rightData = rightData instanceof dataset ? rightData.data : rightData;
            leftHasher = leftHasher || hasher || rightHasher;
            rightHasher = rightHasher || hasher || leftHasher;
            leftSingular = leftSingular || singular || false;
            rightSingular = rightSingular || singular || false;
            matcher = matcher == '=' ? (l,r) => g.eq(l,r) : matcher;

            if (!['hash', 'loop'].includes(algo) && algo != undefined) 
                throw `algo '${algo}' is not recognized.  Pass 'hash', 'loop', or undefined.`;

        // try to parse the matcher into hashers

            if (!leftHasher && !rightHasher && algo != 'loop') {
                let parsedHashers = parser.pairEqualitiesToObjectSelectors(matcher);
                if (parsedHashers) {
                    leftHasher = parsedHashers.leftFunc;
                    rightHasher = parsedHashers.rightFunc;
                }
            }

        // final validations

            if (algo == 'hash' && !leftHasher && !rightHasher)
                throw   `Must loop merge.  "${matcher}" could not be parsed` + 
                        `into functions that return objects for hashing.`;

        // terminations

            let mergeFunc = leftHasher && rightHasher
                ? data => [...hashMerge( 
                        data, rightData, 
                        matcher, mapper, 
                        leftHasher, rightHasher, 
                        leftSingular, rightSingular
                    )]
                : data => [...loopMerge(
                        data, rightData, 
                        matcher, mapper
                    )];

            this.apply(mergeFunc); 
            return this;

    }

    join(rightData, matcher, mergeOptions = {}) {
        let mapper = (l,r) => l&&r ? {...l,...r} : undefined;
        return this.merge(rightData, matcher, mapper, mergeOptions);
    }
    joinLeft(rightData, matcher, mergeOptions = {}) {
        let mapper = (l,r) => l&&r ? {...l,...r} : l;
        return this.merge(rightData, matcher, mapper, mergeOptions);
    }
    joinRight(rightData, matcher, mergeOptions = {}) {
        let mapper = (l,r) => l&&r ? {...l,...r} : r;
        return this.merge(rightData, matcher, mapper, mergeOptions);
    }
    joinFull(rightData, matcher, mergeOptions = {}) {
        let mapper = (l,r) => (l&&r ? {...l, ...r} : l||r);
        return this.merge(rightData, matcher, mapper, mergeOptions);
    }

    exists(rightData, matcher, mergeOptions = { leftSingular: false, rightSingular: true }) {
        let mapper = (l,r) => l&&r ? l : undefined;
        return this.merge(rightData, matcher, mapper, mergeOptions);
    }
    notExists(rightData, matcher, mergeOptions = {}) {
        let mapper = (l,r) => l&&r ? undefined : l;
        return this.merge(rightData, matcher, mapper, mergeOptions);
    }
    notExistsFull(rightData, matcher, mergeOptions = {}) {
        let mapper = (l,r) => l&&r ? undefined : l||r;
        return this.merge(rightData, matcher, mapper, mergeOptions);
    }

    // TODO: Consider the following types:
    //   noij[left|right|both|inner]
    //   joinStack 
    //   unionAll/insert
    //   except
    //   update
    //   scd

    matrix(        
        selector, // csv of prop names or func returning array of numbers
        rowNames // string of a prop name or func identifiying the property representing the name
    ) {
        return new Matrix(this.data, selector, rowNames);
    }

    group (func) {
        super.group(func);
        return this;
    }

    ungroup (mapper) {
        if (mapper)
            this.map(mapper);
        super.ungroup();
        return this;
    }

    get (mapper = null) {
        if (mapper)
            this.map(mapper);
        return this.arrayify();
    }

    toJsonString(func) {
        let getted = this.get(func);
        return JSON.stringify(getted);
    }

}

dataset.fromJson = function(json) {

    let groupify = (arrayified) => {
        let parsed = g.isString(arrayified) 
            ? JSON.parse(arrayified) 
            : arrayified;
        let groupified = grouping.groupify(parsed);
        let ds = new dataset();
        ds.data = groupified.data;
        return ds;
    }

    return json.constructor.name == 'Response' 
        ? json.json().then(groupify)
        : groupify(json);

}
