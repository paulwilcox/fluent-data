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
        return recurse (
            data => data.map(g.noUndefinedForFunc(func)),
            this.data, 
        );
    }

    filter (func) {    
        return recurse (
            data => data.filter(func),
            this.data, 
        );
    }

    sort (func) {

        let params = parser.parameters(func);

        let outerFunc = 
            params.length > 1 
            ? data => data.sort(func)
            : data => quickSort(data, func);
        
        return recurse(outerFunc, this.data);

    } 

    group (func) {
        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets();
        return new recurse(outerFunc, this.data);
    }

    reduce (func) {
        let outerFunc = data => runEmulators(data, func);
        let ds = recurse(outerFunc, this.data);
        return ds;
    }    

    distinct (func) {
        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets()
            .map(bucket => func(bucket[0]));
        return recurse(outerFunc, this.data);
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

    let isNested = Array.isArray(data[0]);

    if (!isNested) 
        return new dataset(func(data));    

    let output = [];

    for (let nested of data)  
        output.push(func(nested));

    return new dataset(output);

}