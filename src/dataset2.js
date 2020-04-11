import * as g from './general.js';

/*

    Having learned about Symbol.Iterator, I'm likely to go back to this.data.
    I may also add this.funcs/commands.  But this time I'll be sure either to
    have private versions of each method so that the names aren't annonymous,
    or to register '{ funcName, args, func } or something like that, so that 
    troubleshooting is easier and so that I can merge map/filter when 
    possible.  
    
    However, will this work for merge?  For that we may need a database-level
    strategy, unfortunately.  

*/

// TODO: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
export default class dataset2 {

    constructor(data) {
        this.data = data;
    }

    [Symbol.iterator] = () => this.data; 

    map (func) {    
        let _map = function*(data) {
            for(let row of data)
                yield g.noUndefined(func(row));
        }
        this.data = recurse(_map, this.data);
        return this;
    }

    get (func) {
        if(func)
            this.map(func);
        return Array.from(this.data);
    }

}

function* recurse (func, data) {

    // func() should be used when 'data' is an unnested iterable

    if (!g.isIterable(data)) {
        console.log(data)
        console.trace()
        throw 'data passed to recurse is not iterable.';
    }

    for (let item of data) {

        // If the first item is not iterable, then
        // you are touching base records.  So 
        // stop everything and just run the passed
        // in function non-recursively.
        if(!g.isIterable(item)) {
            yield* func(data);
            return;
        }

        // If you are not touching base 
        // records, then recurse. 
        yield* recurse(func, item);

    }

}

