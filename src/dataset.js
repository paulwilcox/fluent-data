import * as g from './general.js';
import hashBuckets from './hashBuckets.js';
import { quickSort } from './sorts.js';
import parser from './parser.js';
import { runEmulators } from './reducer.js';
import { merge as mrg, mergeMethod } from './mergeTools.js';

export default class dataset {

    constructor(data) {
        this.data = data;
    }

    map (func) {    
        let _map = function* (data) {
            for(let row of data)
                yield g.noUndefined(func(row));
        }
        this.data = recurse(_map, this.data);
        return this;
    }

    filter (func) {    
        let _filter = function* (data) {
            for(let row of data)
            if(func(row))
                yield row;
        }
        this.data = recurse(_filter, this.data);
        return this;
    }

    sort (func) {
        let outerFunc = parser.parameters(func) > 1 
            ? data => data.sort(func)
            : data => quickSort(data, func);
        this.data = recurse(outerFunc, this.data);
        return this;
    } 

    group (func) {
        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets();
        this.data = recurse(outerFunc, this.data);
        return this.data;
    }

    ungroup (func) {
        this.data = recurseForUngroup(func, this.data);
        return this;
    }

    reduce (
        func, 
        keepGrouped = false
    ) {

        // Reduce expects grouped input.
        // If it's not grouped, wrap it in a trivial group.
        // When done, if desired (keepGrouped), return
        // the reulting singleton object, not the one-item
        // array. 

        let isUngrouped = 
            this.length > 0 
            && !Array.isArray(this.data[0]);

        let recursed = recurse(
            data => runEmulators(data, func), 
            isUngrouped ? [this.data] : this.data
        );

        return !isUngrouped || keepGrouped 
            ? recursed
            : recursed[0];

    }    

    distinct (func) {
        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets()
            .map(bucket => func(bucket[0]));
        let recursed = recurse(outerFunc, this);
        Object.setPrototypeOf(recursed, dataset.prototype);
        return recursed;
    }

    merge (incoming, matcher, options, method) {

        let matcherReturnsString = false;
        try {matcherReturnsString = g.isString(matcher());}
        catch {}

        // user is trying to use shortcut syntax that 
        // uses full object equality by value
        if (matcherReturnsString) {

            let keyword = matcher();
            if(!Object.keys(mergeMethod).includes(keyword)) throw `
                'matcher' param in 'merge' returns a string, but 
                this string is not represented in the 'mergeMethod'
                enumeration.  Choose one of ${mergeMethod}.
            `;

            method = keyword;
            matcher = (l,r) => g.eq(l,r);
            options = { 
                mapper: options,
                hasher: x => x
            }; 

        }

        let outerFunc = data => [...mrg (
            data, 
            incoming, 
            matcher, 
            options, 
            method
        )];

        let recursed = recurse(outerFunc, this);
        Object.setPrototypeOf(recursed, dataset.prototype);
        return recursed;

    }

    with (func) {
        func(this);
        return this;
    }

    get (func) {
        if(func)
            this.map(func);
        return Array.from(this.data);
    }

}

function* recurse (func, data) {

    // func() should be used when 'data' is an unnested iterable

    if (!g.isIterable(data)) {
        console.trace()
        throw 'data passed to recurse is not iterable.';
    }

    for (let item of data) {

        // If the first item is not iterable, then
        // you are touching base records.  So 
        // stop everything and just run the passed
        // in function non-recursively.
        if(!g.isIterable(item)) {
            yield* func(data);
            return;
        }

        // If you are not touching base 
        // records, then recurse. 
        yield* recurse(func, item);

    }

}


function recurseForUngroup (func, data) {
        
    let output = [];            
    let isEnd = 
        Array.isArray(data) &&
        Array.isArray(data[0]) && 
        !Array.isArray(data[0][0]);
            
    if (!isEnd) 
        for (let item of data)
            output.push(recurseForUngroup(func, item));
    else 
        for (let item of data)
        for (let nested of item)
            output.push(func(nested));
    
    return output;

}