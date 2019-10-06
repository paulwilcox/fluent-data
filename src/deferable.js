import * as g from './general.js';

export class deferable {

    constructor(initial) {
        this.value = initial;
        this.thens = [];
        this.status = 'pending'
    }

    then(func) {
        this.thens.push(func);
        return this;
    }

    catch(func) {
        this.catchFunc = func;
        return this;
    }

    execute() {

        for(let func of this.thens) 
            if (g.isPromise(this.value)) {
                this.value = this.value.then(func);
                this.status = 'promisified';
            }
            else {
                try {
                    this.value = func(this.value);
                    if (g.isPromise(this.value))
                        this.status = 'promisified';
                }
                catch(error) {
                    this.status = 'rejected';
                    if (this.catchFunc)
                        this.value = this.catchFunc(error);
                    return this.value;
                }
            }
         
        this.status = 'resolved'; 
        return this.value;

    }

}
