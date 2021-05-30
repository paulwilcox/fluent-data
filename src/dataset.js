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
        obj = g.dotsToProps(obj);

        // wrap result in array to bring back to original nesting level
        this.apply(data => {

            // initializations
            let aggs = {};
            let _data = [...data];
            if (isNaked)
                obj = { naked: obj };

            // perform the aggregations
            for(let [key,reducer] of Object.entries(obj)) {

                let nparams = parser.parameters(reducer).length;
                let seed = reducer.seed === undefined ? 0 : reducer.seed;

                // reducer is meant to apply to entire set of data
                if (nparams == 1)
                    aggs[key] = reducer(_data);

                // reducer is meant to apply to 'accum' and 'next'
                else if (nparams == 2) {
                    let agg = seed;
                    for (let row of _data)
                        agg = reducer(agg, row)
                    aggs[key] = agg;
                }

            }

            // terminations
            if (isNaked)
                aggs = aggs.naked;
            return [aggs]; 

        });

        if (ungroup) 
            this.ungroup();

        return this;

    }

    // TODO: see todo in dataset.md
    window2 ({
        group, 
        sort, 
        filter,
        scroll,
        reduce, 
    } = {}) {
        
        if (group)  this.group(group);
        if (sort)   this.sort(sort);
        if (filter) this.group(filter); 
            // otherwise, you'd have to also 
            // explicitly group by any filtering 

        this.apply(function*(data) {

            let _data = [...data];
            let filtered = filter ? _data.filter(filter) : _data;            
            let aggs = !scroll ? new dataset(filtered).reduce(reduce).get() : {};
            
            // group did not pass the filter
            if (filtered.length == 0) 
                for(let key of Object.keys(aggs))
                    aggs[key] = null;

            for(let currentIx = 0; currentIx < _data.length; currentIx++) {

                if (scroll && filtered.length > 0) {
                    let scrolled = filtered.filter(
                        (row,compareIx) => scroll(currentIx,compareIx)
                    );                
                    aggs = new dataset(scrolled).reduce(reduce).get();
                }

                yield Object.assign(_data[currentIx], aggs);

            }

        });

        if (group)  this.ungroup();
        if (filter) this.ungroup();

        return this;

    }


    window (obj, group, sort, filter) {
        
        if (group)  this.group(group);
        if (sort)   this.sort(sort);
        if (filter) this.group(filter); 
            // otherwise, you'd have to also 
            // explicitly group by any filtering 

        this.apply(function*(data) {
            let _data = [...data];
            let sub = _data;
            if (filter) 
                sub = sub.filter(filter);
            let aggs = new dataset(sub).reduce(obj).get();
            // group did not pass the filter
            if (sub.length == 0) 
                for(let key of Object.keys(aggs))
                    aggs[key] = null;
            for(let row of _data) 
                yield Object.assign(row, aggs);
        });

        if (group)  this.ungroup();
        if (filter) this.ungroup();

        return this;

    }

    scroll (obj, group, sort, filter) {
        
        if (group)  this.group(group);
        if (sort)   this.sort(sort);
        if (filter) this.group(filter); 
            // otherwise, you'd have to also 
            // explicitly group by any filtering 

        this.apply(function*(data) {
            let _data = [...data];
            for(let currentIx = 0; currentIx < _data.length; currentIx++) {
                let sub = _data.filter(
                    (row,compareIx) => filter(_data[currentIx],currentIx,compareIx)
                );
                let aggs = new dataset(sub).reduce(obj).get();
                // group did not pass the filter
                if (sub.length == 0) 
                    for(let key of Object.keys(aggs))
                        aggs[key] = null;
                yield Object.assign(_data[currentIx], aggs);
            }
        });

        if (group)  this.ungroup();
        if (filter) this.ungroup();

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
            matcher = matcher == '=' ? (l,r) => g.eq(l,r) : matcher || ((l,r) => true);

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

    toJsonString(replacer, space) {
        let getted = this.get();
        return JSON.stringify(getted, replacer, space);
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
