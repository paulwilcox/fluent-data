import * as g from './general.js';
import hashBuckets from './hashBuckets.js';
import { quickSort } from './sorts.js';
import { runEmulators } from './reducer.js';
import merger from './merger.js';
import { print as prn } from './visualizer/printer.js';

export default class {

    constructor(data) {
        super();
        this.data = data;
    }

    map (func) {    
        this.data = recurse (
            data => data.map(g.noUndefinedForFunc(func)),
            this.data, 
        );
    }

    filter (func) {    
        this.data = recurse (
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
        
        this.data = recurse(
            outerFunc,
            this.data
        );

    } 

    group (func) {
        this.data = 
            new hashBuckets(func)
            .addItems(this.data)
            .getBuckets();
    }

    reduce (func) {
        let outerFunc = data => runEmulators(data, func);
        this.data = ds.callNested(outerFunc, this.data);
        // because runEmulators might return a non-array
        if (!Array.isArray(this.data))
            this.data = [this.data];
    }    

    merge (rightData, matchingLogic, mapper, onDuplicate) {
        this.data = merger (
            this.data, 
            rightData, 
            matchingLogic, 
            mapper, 
            onDuplicate
        );
    }

    print (func, caption, target) {

        let data = recurse (
            data => data.map(g.noUndefinedForFunc(func)),
            this.data, 
        );

        if (target) 
            prn(target, data, caption)
        else if(caption)
            console.log(caption, data) 
        else 
            console.log(data); 

    }

}


function recurse (func, data) {

    let isNested = Array.isArray(data[0]);

    if (!isNested) 
        return func(data);    

    let output = [];

    for (let nested of data)  
        output.push(func(nested));

    return output;

}