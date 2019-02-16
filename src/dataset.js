import * as g from './general.js';
import { dsGetter } from './dsGetter.js';

export class dataset {

    constructor(key, data) {
        this.key = key;
        this.data = data;
    }

    apply (arrayOperation, innerFunc) {

        if (this.data instanceof dsGetter) {
            this.data = this.data[arrayOperation](innerFunc);
            return;
        }

        if (g.isString(arrayOperation))
            arrayOperation = Array.prototype[arrayOperation];        

        this.data = this.applyToNested(arrayOperation, innerFunc, this.data);

    }

    applyToNested(
        arrayOperation,
        innerFunc,
        maybeNested
    ) {

        // if not nested, apply the function
        if (!Array.isArray(maybeNested[0]) || maybeNested.length == 0) { 
            let func = array => arrayOperation.call(array, innerFunc); 
            return func(maybeNested);           
        }
    
        let output = [];
    
        for (let nested of maybeNested) 
            output.push(
                applyToNested(outerFunc, innerFunc, nested)
            );
    
        return output;
    
    }

}