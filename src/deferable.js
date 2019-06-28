import * as g from './general.js';

// TODO: Implement Catch and Finally
export class deferable {

    constructor(initial) {
        this.value = initial;
        this.thens = [];
    }

    then(func) {
        this.thens.push(func);
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

}
