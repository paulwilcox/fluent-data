import * as g from './general.js';
import hashBuckets from './hashBuckets.js';
import { quickSort } from './sorts.js';
import Matrix from './matrix.js';
import parser from './parser.js';
import { merge as mrg } from './mergeTools.js';

export default class dataset {

    constructor(data, groupLevel = 1) {
        this.data = data;
        this.groupLevel = groupLevel;
        this._appendMerges();
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

        if (!func) 
            func = x => x;

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

    reduce (obj, ungroup = true) {

        let isNaked = Object.keys(obj).length == 0;

        // wrap result in array to bring back to original nesting level
        let outerFunc = data => {
            let agg = {};
            if (isNaked)
                return [obj(data)];
            for(let [key,reducer] of Object.entries(obj)) {
                agg[key] = reducer(data);
            }
            return [agg]; 
        }

        this.data = recurse(outerFunc, this.data, this.groupLevel);

        if (ungroup)
            this.ungroup();

        return this;

    }

    distinct (func, sorter) {

        func = func || (x => x);
        
        if (sorter) sorter = 
            parser.parameters(sorter).length > 1 
            ? data => quickSort(data, func, false)
            : data => quickSort(data, func, true);
        else 
            sorter = data => data;

        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets()
            .map(bucket => {
                return [...sorter(bucket)][0]
            });

        this.data = recurse(outerFunc, this.data, this.groupLevel);
        return this;

    }

    merge (args) {

        let leftData = this.data;
        let rightData = args.other instanceof dataset ? args.other.data : args.other;
        let matcher = args.matcher == '=' ? (l,r) => g.eq(l,r) : args.matcher;
        let mapper = args.mapper;
        let leftHasher = args.leftHasher || args.hasher || args.leftHasher;
        let rightHasher = args.rightHasher || args.hasher || args.rightHasher;  
        let leftSingular = args.leftSingular || args.singular || false;
        let rightSingular = args.rightSingular || args.singular || false;
        let algo = args.algo || 'hash';    
    
        let outerFunc = data => [...mrg({
            leftData, 
            rightData, 
            matcher, 
            mapper, 
            leftHasher,
            rightHasher,
            leftSingular,
            rightSingular,
            algo
        })];

        this.data = recurse(outerFunc, this.data, this.groupLevel); 
        return this;

    }

    // append various convenience functions wrapping 'merge()'
    _appendMerges () {

        let appender = (funcName, mapper) => 
            this[funcName] = (other, matcher, singular = false, algo = 'hash') => 
                this.merge({ other, matcher, mapper, singular, algo })                 
                
        // TODO: add joinThob and joinStack 
        appender('joinBoth', (l,r) => ({...r,...l}) );
        appender('joinLeft', (l,r) => l&&r ? {...r,...l} : l );
        appender('joinRight', (l,r) => l&&r ? {...r,...l} : r ); 
        appender('joinInner', (l,r) => l&&r ? {...r,...l} : undefined );
        appender('existsLeft', (l,r) => l&&r ? l : undefined );
        appender('existsRight', (l,r) => l&&r ? r : undefined );
        appender('updateLeft', (l,r) => l&&r ? r : l );
        appender('updateRight', (l,r) => l&&r ? l : r );
        appender('upsertLeft', (l,r) => l&&r ? r : l||r );
        appender('upsertRight', (l,r) => l&&r ? l : l||r );
        appender('notExistsBoth', (l,r) => l&&r ? undefined : l||r );
        appender('notExistsLeft', (l,r) => l&&r ? undefined : l );
        appender('notExistsRight', (l,r) => l&&r ? undefined : r );

    }

    matrix(        
        selector, // csv of prop names or func returning array of numbers
        rowNames // string of a prop name or func identifiying the property representing the name
    ) {
        return new Matrix(this.data, selector, rowNames);
    }

    with (func) {
        let arr = recurseToArray(x => x, this.data, this.groupLevel);
        func(arr);
        this.data = arr;
        return this;
    }

    get (func) {
        if (!g.isIterable(this.data)) {
            if (func)
                this.data = func(this.data);
            return this.data;
        }
        let arr = recurseToArray(
            func || function(x) { return x }, 
            this.data,
            this.groupLevel
        );
        this.data = arr;
        return arr;
    }

    toJsonString(func) {
        let dataJson = JSON.stringify(this.get(func));
        return `{"data":${dataJson},"groupLevel":${this.groupLevel}}`;
    }

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
            : g.noUndefined(func(item))
        );
    return list;    

}

