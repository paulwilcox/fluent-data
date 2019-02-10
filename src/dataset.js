import * as g from './general.js';
import { dsGetter } from './dsGetter.js';

export class dataset {

    constructor(key, data) {
        this.key = key;
        this.data = data;
    }

    keyMatch (key, matchExactly = false) {
        key = g.asSet(key);
        return matchExactly
            ? g.isSubsetOf(key, this.key) && g.isSubsetOf(this.key, key)
            : g.isSubsetOf(key, this.key);
    }

    rename (newKey) {
        this.key = g.asSet(newKey);
    }

    apply (arrayOperation, innerFunc) {

        if (this.key.size > 1)
            innerFunc = this.literalize(innerFunc);

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

    // Takes function inputs and makes it so that 
    // those serve as references to the properties
    // of an object.
    literalize (func) {
            
        let params = new parser(func).parameters;

        let applyIt = (func, args) => {

            let objectToApply = {};

            for(let arg of args)
            for(let param of params) 
                if(Object.keys(arg).includes(param))
                    objectToApply[param] = arg[param];

            return func
                .apply(
                    null,
                    Object.values(objectToApply)
                ); 

        };

        return (...args) => applyIt(functionToProcess, args);

    }  

}