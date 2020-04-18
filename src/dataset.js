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

    *[Symbol.iterator]() { 
        yield* this.data;
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
        return this;
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

        let iter = g.peekable(data);

        let isUngrouped = 
            !iter.peek().done  
            && !g.isIterable(iter.peek().value);

        let recursed = recurse(
            data => runEmulators(data, func), 
            isUngrouped ? [iter] : iter
        );

        this.data = !isUngrouped || keepGrouped 
            ? recursed
            : recursed.next().value; 

        return this;

    }    

    distinct (func) {
        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets()
            .map(bucket => func(bucket[0]));
        this.data = recurse(outerFunc, this.data);
        return this;
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
            incoming.data, 
            matcher, 
            options, 
            method
        )];

        // TODO: Consider below:
        // Recursion when dealing with multiple datasets
        // is not advised.  Code not functional in this
        // case but even if it was I would quesiton wether
        // it wouldn't be confusing, as it would consume
        // a dataset you're not seeking to manipulate.
        // Maybe we can rescue this at the dataset level
        // by forcing Array.from against the incoming data
        // at the dataset level.
        // this.data = recurse(outerFunc, this.data);
        this.data = outerFunc(this.data); 
        return this;

    }

    // TODO: Since we're dealing with an iterable, this 
    // take this.data to a 'done' state before we're ready
    with (func) {
        func(this.data);
        return this;
    }

    get (func) {
        return recurseToArray(
            func || function(x) { return x }, 
            this.data
        );
    }

}

function* recurse (func, data) {

    // func() should be used when 'data' is an unnested iterable

    verifyRecursable(data);
    let iter = g.peekable(data);

    // data is base records
    if(!g.isIterable(iter.peek().value)) {
        yield* func(iter);
        return;
    }

    // data is nested group 
    for (let item of iter) 
        yield recurse(func, item);

}

/*
function recurseForUngroup (func, data) {
        
    let isEnd = false;

    verifyRecursable(data);

    let iterator = function* () { yield* data; }();
    let peeker = g.peeker(iterator);
        

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
*/
function recurseToArray (func, data) {

    verifyRecursable(data);
    let iter = g.peekable(data);

    let list = [];
    for(let item of iter)
        list.push(
            g.isIterable(iter.peek().value)                
            ? recurseToArray(func, item)
            : func(item)
        );
    return list;    

}

function verifyRecursable (data) {
    if (g.isIterable(data)) 
        return;
    console.trace();
    throw 'Data is not iterable.  Cannot use for recursion.';
}

/*
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
*/