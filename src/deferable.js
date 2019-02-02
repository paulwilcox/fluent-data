import * as g from './general.js';

// TODO: Implement Catch and Finally
export class deferable {

    constructor(initial) {
        this.value = initial;
        this.thens = [];
        this.onCatch;
        this.onFinally;
    }

    then(func) {
        this.thens.push(func);
        return this;
    }

    catch(func) {
        this.onCatch = func;
        return this;
    }

    finally(func) {
        this.onFinally = func;
        return this;
    }

    execute() {

        for(var func of this.thens) 
            if (g.isPromise(this.value))
                this.value.then(func);
            else 
                this.value = func(this.value);
        
        return this.value;

    }

    wrapExecute(wrapFunc) {

        for(var func of this.thens) {

            if (wrapFunc)
                

            if (g.isPromise(this.value))
                this.value.then(func);
            else 
                this.value = func(this.value);

        }
        
        return this.value;

    }

}

deferable.deferify = function (container, funcNamesCsv) {

    let funcNames = 
        funcNamesCsv
        .split(',')
        .map(fn => fn.trim());

    for(let funcName of funcNames)

        container[funcName] = 
            function(...args) {
                return this.then(cont => cont[funcName](...args) );
            };

}