import * as g from './general.js';
import hashBuckets from './hashBuckets.js';
import { quickSort } from './sorts.js';
import parser from './parser.js';
import { runEmulators } from './reducer.js';
import { merge as mrg, mergeMethod } from './mergeTools.js';

export default class dataset extends Array {

    constructor(...data) {
        super(...data);
    }

    map (func) {    
        let recursed = recurse(
            data => Array.prototype.map.call(
                data, 
                g.noUndefinedForFunc(func)
            ),
            this 
        );
        Object.setPrototypeOf(recursed, dataset.prototype);
        return recursed;
    }

    filter (func) {    
        let recursed = recurse(
            data => Array.prototype.filter.call(
                data,
                func
            ),
            this, 
        );
        Object.setPrototypeOf(recursed, dataset.prototype);
        return recursed;
    }

    sort (func) {

        let params = parser.parameters(func);

        let outerFunc = params.length > 1 
            ? data => Array.prototype.sort.call(data, func)
            : data => quickSort(data, func);
        
        let recursed = recurse(outerFunc, this);
        Object.setPrototypeOf(recursed, dataset.prototype);
        return recursed;

    } 

    group (func) {
        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets();
        let recursed = recurse(outerFunc, this);
        Object.setPrototypeOf(recursed, dataset.prototype);
        return recursed;
    }

    ungroup (func) {
        let recursed = recurseForUngroup(func, this);
        Object.setPrototypeOf(recursed, dataset.prototype);
        return recursed;
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
            && !Array.isArray(this[0]);

        let recursed = recurse(
            data => runEmulators(data, func), 
            isUngrouped ? [this] : this
        );
        Object.setPrototypeOf(recursed, dataset.prototype);

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

}

function recurse (func, data) {

    let output = [];
    let isEnd = 
        Array.isArray(data) && 
        !Array.isArray(data[0]);

    if (!isEnd) {
        for (let item of data)
            output.push(recurse(func, item));
        return output;
    }
    else 
        return func(data);

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