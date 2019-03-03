import * as g from './general.js';
import { dsGetter } from './dsGetter.js';
import { quickSort } from './sorts.js';

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
            return arrayOperation.call(maybeNested, innerFunc);           
        }
    
        let output = [];
    
        for (let nested of maybeNested)  
            output.push(
                this.applyToNested(arrayOperation, innerFunc, nested)
            );
    
        return output;
    
    }




    apply2 (arrayOperation) {

        this.data = this.applyToNested2(arrayOperation, this.data);

    }

    applyToNested2(
        arrayOperation,
        maybeNested
    ) {

        // if not nested, apply the function
        if (!Array.isArray(maybeNested[0]) || maybeNested.length == 0) 
            return arrayOperation.call(maybeNested);           
    
        let output = [];
    
        for (let nested of maybeNested)  
            output.push(
                this.applyToNested2(arrayOperation, nested)
            );
    
        return output;
    
    }

}