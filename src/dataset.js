import * as g from './general.js';
import { dsGetter } from './dsGetter.js';

export class dataset {

    constructor(key, data) {
        this.key = key;
        this.data = data;
    }

    call (arrayOperation, ...args) {

        this.data = this.callWithoutModify(
            arrayOperation, 
            ...args 
        );

    }

    callWithoutModify (arrayOperation, ...args) {

        if (this.data instanceof dsGetter) {
            // ...args simply the lambda function
            this.data = this.data[arrayOperation](...args); 
            return;
        }

        let fromArrayProto = g.isString(arrayOperation);

        if (fromArrayProto) 
            arrayOperation = Array.prototype[arrayOperation];        

        return this.callNested(
            arrayOperation, 
            fromArrayProto,
            this.data,
            ...args 
        );
            
    }

    callNested(
        arrayOperation,
        fromArrayProto,
        maybeNested,
        ...args
    ) {

        // if not nested, apply the function
        if (!Array.isArray(maybeNested[0]) || maybeNested.length == 0) 
            return fromArrayProto 
                ? arrayOperation.call(maybeNested, ...args)
                : arrayOperation.call(null, maybeNested, ...args);    
    
        let output = [];
    
        for (let nested of maybeNested)  
            output.push(
                this.callNested(arrayOperation, fromArrayProto, nested, ...args)
            );
    
        return output;
    
    }

}