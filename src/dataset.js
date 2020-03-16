import * as g from './general.js';
import hashBuckets from './hashBuckets.js';
import { quickSort } from './sorts.js';
import parser from './parser.js';
import { runEmulators } from './reducer.js';
import { merge as mrg } from './mergeTools.js';

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

    merge (incoming, matchingLogic, mapper, distinct) {
        let merged = [...mrg (
            this, 
            incoming, 
            matchingLogic, 
            mapper, 
            distinct
        )];
        Object.setPrototypeOf(merged, dataset.prototype);
        return merged;
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