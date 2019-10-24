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

        try {
                
            for(let func of this.thens) 
                this.value = g.isPromise(this.value) 
                    ? this.value.then(func)
                    : func(this.value);

            this.status = g.isPromise(this.value) 
                ? 'promisified' 
                : 'resolved'; 
            
            if (g.isPromise(this.value) && this.catchFunc)
                this.value = this.value.catch(this.catchFunc);

            return this.value;

        }

        catch(error) {
            this.status = 'rejected';
            if (this.catchFunc) {
                this.value = this.catchFunc(error);
                return;
            }
            throw error;
        }

    }

}
