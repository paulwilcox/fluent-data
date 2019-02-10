import * as g from './general.js';

// TODO: Implement Catch and Finally
export class deferable {

    constructor(initial) {
        this.value = initial;
        this.thens = [];
        this.currentFunc;
        this.currentArgs;
    }

    then(func) {
        this.thens.push(func);
        return this;
    }

    before(func) {
        this.beforeThen = func;
    }

    after(func) {
        this.afterThen = func;
    }

    execute() {

        let runFunc = f => { 
            if (g.isPromise(this.value)) 
                this.value.then(f);
            else 
                this.value = f(this.value);
        }

        for(var func of this.thens) 
            runFunc(func);

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
                return this
                    .then(cont => {
                        if (this.beforeThen) 
                            return this.beforeThen(args);
                        return cont;
                    })
                    .then(cont => {
                        cont[funcName](...args);
                        return cont;
                    })
                    .then(cont => {
                        if (this.afterThen) 
                            return this.afterThen(args);
                        return cont;
                    });

            };

}

