import * as g from './general.js';
import hashBuckets from './hashBuckets.js';
import { quickSort } from './sorts.js';
import parser from './parser.js';
import { runEmulators } from './reducer.js';
import { merge as mrg } from './mergeTools.js';

export default class dataset {

    constructor(data) {
        this.data = data;
    }

    map (func) {    
        return new dataset(recurse (
            data => data.map(g.noUndefinedForFunc(func)),
            this.data, 
        ));
    }

    filter (func) {    
        return new dataset(recurse (
            data => data.filter(func),
            this.data, 
        ));
    }

    sort (func) {

        let params = parser.parameters(func);

        let outerFunc = 
            params.length > 1 
            ? data => data.sort(func)
            : data => quickSort(data, func);
        
        return new dataset(
            recurse(outerFunc, this.data)
        );

    } 

    group (func) {
        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets();
        return new dataset(
            recurse(outerFunc, this.data)
        );
    }

    ungroup (func) {
        return new dataset(
            recurseForUngroup(func, this.data)
        );
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
            this.data.length > 0 
            && !Array.isArray(this.data[0]);

        let result = recurse(
            data => runEmulators(data, func), 
            isUngrouped ? [this.data] : this.data
        );

        return !isUngrouped || keepGrouped 
            ? new dataset(result)
            : result[0];

    }    

    distinct (func) {
        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets()
            .map(bucket => func(bucket[0]));
        return new dataset(
            recurse(outerFunc, this.data)
        );
    }

    merge (incoming, matchingLogic, mapper, distinct) {
        return new dataset([...mrg (
            this.data, 
            incoming, 
            matchingLogic, 
            mapper, 
            distinct
        )]);
    }

    get (func) {
        return this.map(func).data;
    }

    with (func) {
        func(this.data);
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