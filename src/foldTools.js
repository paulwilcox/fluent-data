// 'folder' signifies 'aggregator', not
// 'holder of files'
export class foldBuilder {

    constructor() {
        this.data = [];
        this.folded;
        this.steps = [];
    }

    loadValue(value) {
        this.data.push(value);
    }

    fold(func, seed, filter = x => true) {

        this.steps.push(() => {

            // Return 'null' instead of 'typeerror' (which 
            // is what Array.prototype.reduce returns)
            if (this.data.length == 0) {
                this.folded = null;
                return;
            }

            let v = 0; 

            // if the seed doesn't meet the filter, it's as
            // though no seed were set.
            if (seed === undefined || !filter(seed)) {
                this.folded = this.data[0];
                v = 1;
            } 
            else
                this.folded = seed;

            for (v; v < this.data.length; v++) 
            if (filter(this.data[v])) 

                // matches signature of first 'reducer' argument
                // in Array.prototype.reduce
                this.folded = func(
                    this.folded, // accumulator
                    this.data[v], // current value
                    v, // current index
                    this.data // source array
                );
        });

        return this;

    }

    changeData(func) {
        this.steps.push(() => {
            for (let rowIx in this.data) 
                this.data[rowIx] = func(this.data[rowIx], this.folded);
        });
        return this;
    }

    changeFolded(func) {
        this.steps.push(() => {
            this.folded = func(this.folded);
        });
        return this;
    }

    emulators(func) {
        this.steps.push(() => {
            this.folded = runEmulators(this.data, func);        
        });
        return this;
    }

    execute() {
        for(let step of this.steps)  
            step();
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
    constructor(rowValue, funcName) {
        this.rowValue = rowValue;
        this.funcName = funcName;
    }
}

// 'emulatorsFunc' is what the user will pass in.
export let runEmulators = function (
    dataset,
    emulatorsFunc
) {

    let chosenFolders = {};
    let isNaked = false;

    for (let row of dataset) {

        let emulators = emulatorsFunc(row);
        let isNaked = emulators instanceof emulator;

        // So that user can pass unwrapped emulator and 
        // we still use the same logic.
        if (isNaked) 
            emulators = { x: emulators };

        for (let key of Object.keys(emulators)) {

            if (!chosenFolders[key]) 
                chosenFolders[key] = folders[emulators[key].funcName];

            chosenFolders[key].loadValue(emulators[key].rowValue);

        }

    }

    for (let key of Object.keys(chosenFolders)) 
        chosenFolders[key] = chosenFolders[key].execute();

    if (isNaked) 
        chosenFolders = chosenFolders.x;

    return chosenFolders;

}

// folders is an object of functions that return 
// folder.  If it had direct folders, then
// any repeated use of the same property (such as using
// sum twice) would refer to the same folder INSTANCE.
export let folders = {};

