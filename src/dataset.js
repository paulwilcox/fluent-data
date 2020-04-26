import * as g from './general.js';
import hashBuckets from './hashBuckets.js';
import { quickSort } from './sorts.js';
import parser from './parser.js';
import { runEmulators } from './reducer.js';
import { merge as mrg, mergeMethod } from './mergeTools.js';

export default class dataset {

    constructor(data, groupLevel = 1) {
        this.data = data;
        this.groupLevel = groupLevel;
    }

    *[Symbol.iterator]() { 
        yield* this.data;
    }

    map (func) {    
        let _map = function* (data) {
            for(let row of data)
                yield g.noUndefined(func(row));
        }
        this.data = recurse(_map, this.data, this.groupLevel);
        return this;
    }

    filter (func) {    
        let _filter = function* (data) {
            for(let row of data)
            if(func(row))
                yield row;
        }
        this.data = recurse(_filter, this.data, this.groupLevel);
        return this;
    }

    sort (func) {
        let outerFunc = parser.parameters(func).length > 1 
            ? data => quickSort(data, func, false)
            : data => quickSort(data, func, true);
        this.data = recurse(outerFunc, this.data, this.groupLevel);
        return this;
    } 

    group (func) {
        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets();
        this.data = recurse(outerFunc, this.data, this.groupLevel);
        this.groupLevel++;
        return this;
    }

    ungroup (func) {

        if (this.groupLevel == 1) {
            let counter = 0;
            for (let item of this.data) {
                if (++counter > 1)
                    throw   'Ungrouping to level 0 is possible, but ' +
                            'there can only be one item in the dataset.';
                this.data = item;
            }
            this.groupLevel--;
            return this;
        }

        let outerFunc = function* (data) {
            for (let item of data)
            for (let nested of item)
                yield func(nested);
        }

        // stop early becuase you want one level above base records
        this.data = recurse(outerFunc, this.data, this.groupLevel - 1);
        this.groupLevel--;
        return this;

    }

    reduce (func, ungroup = true) {
        // Wrap outerFunc result in array to restore the group level
        let outerFunc = data => [runEmulators(data, func)];
        this.data = recurse(outerFunc, this.data, this.groupLevel);
        if (ungroup)
            this.ungroup(x => x);
        return this;
    }    

    distinct (func) {
        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets()
            .map(bucket => func(bucket[0]));
        this.data = recurse(outerFunc, this.data, this.groupLevel);
        return this;
    }

    // TODO: Test whether this consumes the external dataset
    // by iterating it.
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

        this.data = recurse(outerFunc, this.data, this.groupLevel); 
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
            this.data,
            this.groupLevel
        );
    }

    toJson(func) {
        let dataJson = JSON.stringify(this.get(func));
        return `{"data":${dataJson},"groupLevel":${this.groupLevel}}`;
    }

}

// Untested
dataset.fromJson = function(json) {

    if (json.constructor.name == 'Response') 
        return json.json().then(parsed => {
            this.data = parsed.data;
            this.groupLevel = parsed.groupLevel;
            return this;
        });

    let parsed = g.isString(json) ? JSON.parse(json) : json;
    this.data = parsed.data;
    this.groupLevel = parsed.groupLevel;

}

function* recurse (func, data, levelCountdown) {

    if (levelCountdown === 0)
        return func([data])[0];

    if (levelCountdown > 1) { // data is nested groups
        for (let item of data) 
            yield recurse(func, item, levelCountdown - 1);
        return;
    }

    yield* func(data); // data is base records

}

function recurseToArray (func, data, levelCountdown) {

    if (levelCountdown === 0)
        return func([data])[0];

    let list = [];
    for(let item of data)
        list.push(
            levelCountdown > 1          
            ? recurseToArray(func, item, levelCountdown - 1)
            : func(item)
        );
    return list;    

}

