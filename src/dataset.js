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
            recurseForGroup(outerFunc, this.data)
        );
    }

    ungroup (func) {

        let _recurse = data => {
        
            let output = [];            
            let isEnd = 
                Array.isArray(data[0])
                && !Array.isArray(data[0][0]);
                    
            if (!isEnd) 
                for (let item of data)
                    output.push(_recurse(item));
            else 
                for (let item of data)
                for (let nested of item)
                    output.push(func(nested));
            
            return output;

        }

        return new dataset(_recurse(this.data));

    }

    reduce (func) {
        let outerFunc = data => runEmulators(data, func);
        return new dataset( 
            recurse(outerFunc, this.data)
        );
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

    // TODO: with the addition of .with(), does it 
    // make sense to have print anymore?
    print (func, caption) {

        let data = recurse (
            data => data.map(g.noUndefinedForFunc(func)),
            this.data, 
        ).data;

        if(caption)
            console.log(caption, data) 
        else 
            console.log(data); 

        return this;
        
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
    let isEnd = Array.isArray(data) && !Array.isArray(data[0]);

    if (!isEnd) {
        for (let item of data)
            output.push(recurse(func, item));
        return output;
    }
    else 
        return func(data);

}

function recurseForGroup (func, data) {

    let output = [];
    let isEnd = Array.isArray(data) && !Array.isArray(data[0]);

    if (!isEnd) {
        for (let item of data)
            output.push(recurseForGroup(func, item));
        return output;
    }
    else 
        return func(data);

}

function recurse2 (func, data) {

    let isNested = Array.isArray(data[0]);

    if (!isNested) 
        return new dataset(func(data));    

    let output = [];

    for (let nested of data)  
        output.push(func(nested));

    return new dataset(output);

}