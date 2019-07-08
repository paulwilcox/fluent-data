// 'folder' signifies 'aggregator', not
// 'holder of files'
export class foldBuilder {

    constructor() {
        this.folded;
        this.steps = [];
    }

    fold(func, seed, filter = x => true) {

        this.steps.push((data) => {

            // Return 'null' instead of 'typeerror' (which 
            // is what Array.prototype.reduce returns)
            if (data.length == 0) {
                this.folded = null;
                return;
            }

            let v = 0; 

            // if the seed doesn't meet the filter, it's as
            // though no seed were set.
            if (seed === undefined || !filter(seed)) {
                this.folded = data[0];
                v = 1;
            } 
            else
                this.folded = seed;

            for (v; v < data.length; v++) 
            if (filter(data[v])) {
                
                // matches signature of first 'reducer' argument
                // in Array.prototype.reduce
                this.folded = func(
                    this.folded, // accumulator
                    data[v], // current value
                    v, // current index
                    data // source array
                );
            }

        });

        return this;

    }

    changeFolded(func) {
        this.steps.push(() => 
            this.folded = func(this.folded)
        );
        return this;
    }

    changeData(func) { 
        this.steps.push(data => {
            for (let rowIx in data) 
                data[rowIx] = func(data[rowIx], this.folded);
        });
        return this;
    }

    emulators(func) {
        this.steps.push(data => {
            this.folded = runEmulators(data, func, false);    
        });
        return this;
    }

    execute(data) {
        for(let step of this.steps)  
            step(data);
        return this.folded;
    }

}

// Aggregators such as 'sum' or 'avg' operate on
// columnar data.  But the values passed to the
// aggregators, such as 'x' in 'sum(x)' or 'avg(x)'
// are point data.  'emulator' stores the row value,
// but it also stores the name of the intented 
// function (the one it emulates), for later loading
// into a master aggregators object.  The name keeps
// things cheap.  Obviously we don't want the whole
// function for every row.  
//
// TODO: Put in a reference to the function if I can
// ensure it's static.
export class emulator {
    constructor(funcName, rowValue) {
        this.rowValue = rowValue;
        this.funcName = funcName;
    }
}

// 'emulatorsFunc' is what the user will pass in.
export let runEmulators = function (
    dataset,
    emulatorsFunc,
    isFirstRun = true
) {

    let keyStore = {};
    let isNaked = false;

    for (let row of dataset) {

        let emulators = 
            isFirstRun || !Array.isArray(row) 
            ? emulatorsFunc(row) 
            : emulatorsFunc(...row);
        
        if (emulators instanceof emulator) {
            isNaked = true;
            emulators = { x: emulators };
        }

        for (let key of Object.keys(emulators)) {

            let rowValue = isFirstRun ? emulators[key].rowValue : emulators[key].rowValue[0];

            if (!keyStore[key]) 
                keyStore[key] = {
                    chosenFolder: folders[emulators[key].funcName],
                    data: []
                };

            keyStore[key].data.push(rowValue);

        }

    }

    for (let key of Object.keys(keyStore)) 
        keyStore[key] = keyStore[key].chosenFolder.execute(keyStore[key].data);

    if (isNaked)
        keyStore = keyStore.x;

    return keyStore;

}

// folders is an object of functions that return 
// folder.  If it had direct folders, then
// any repeated use of the same property (such as using
// sum twice) would refer to the same folder INSTANCE.
export let folders = {};


/*

    Testing:
        - $$.foldBuilder('test2').emulators((x,y) => ({ a: $$.sum(x), b: $$.sum(y)}))
        - $$({ o: sample.orders }).fold(o => ({test2: $$.test2(1, -1)})).execute(o => o);
        - Purposes:
            > Ensures recycling of agg functions works properly (use of $$.sum inside $$.test2)
            > Ensures state independence of recyled functions (it used to be that properties 'a'
                and 'b' in the example above would cause the object of $$.sum to load data in 
                a way such that all row values would go into the data for 'a' and the data for 'b' 
                would be undefined.  So the result would be {a: 0, b: undefined} because the data
                for 'a' would have as many 1's as -1's and there would be no data for 'b')

    Round 1:
        - Dataset: It's the original rows of the 'o' dataset
        - Emulators: rowValue for first and only emuator 'test2' is an array of singletons, 
            > because $$[funcName] is (...vals) => new emulator(name, vals);

    Round 2:
        - Dataset: Its the accumulation of the array of singletons from Round 1
        - Emulators: is {a, b}, where a and b are both emuators
            > a has rowValue of [1], b has rowValue of [-1]
            > but before loading, these are unboxed to be 1 and -1, respectively

    Round 3: 
        - Fold is run twice, once for a, and once for b
        - The datasets are array of singletons for the 1's and -1's, respectively

*/