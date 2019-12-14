import * as g from './general.js';
import hashBuckets from './hashBuckets.js';
import { quickSort } from './sorts.js';
import { runEmulators } from './reducer.js';
import merger from './merger.js';
import { print as prn } from './visualizer/printer.js';

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
        return new hashBuckets(func)
            .addItems(this.data)
            .getBuckets();
    }

    reduce (func) {
        let outerFunc = data => runEmulators(data, func);
        let ds = recurse(outerFunc, this.data);
        // because runEmulators might return a non-array
        if (!Array.isArray(ds.data))
            ds.data = [data];
        return ds;
    }    

    merge (incoming, matchingLogic, mapper, onDuplicate) {
        return new dataset(merger (
            this.data, 
            incoming, 
            matchingLogic, 
            mapper, 
            onDuplicate
        ));
    }

    print (func, caption, target) {

        let data = recurse (
            data => data.map(g.noUndefinedForFunc(func)),
            this.data, 
        ).data;

        if (target) 
            prn(target, data, caption)
        else if(caption)
            console.log(caption, data) 
        else 
            console.log(data); 

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

    return output;

}