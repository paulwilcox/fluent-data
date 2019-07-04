// 'folder' signifies 'aggregator', not
// 'holder of files'
class folder {

    constructor() {
        this.data = [];
        this.folded;
        this.steps = [];
    }

    loadValue(value) {
        this.data.push(value);
    }

    fold(func, seed, filter) {
        this.steps.push({                
            func: func, 
            seed: seed,
            filter: filter || (x => true),
            type: 'fold'
        });
        return this;
    }

    changeData(func) {
        this.steps.push({
            func: func,
            type: 'changeData'
        });
        return this;
    }

    changeFolded(func) {
        this.steps.push({
            func: func,
            type: 'changeFolded'
        });
        return this;
    }

    emulators(func) {
        this.steps.push({
            func: func,
            type: 'emulators'
        });
        return this;
    }

    execute () {
        for(let step of this.steps)  
            this.applyStep(step);
        return this.folded;
    }

    applyStep (step) {

        if (step.type == 'changeFolded') 
            this.folded = step.func(this.folded);
        
        else if (step.type == 'fold') {

            // Return 'null' instead of 'typeerror' (which 
            // is what Array.prototype.reduce returns)
            if (this.data.length == 0) {
                this.folded = null;
                return;
            }

            let v = 0; 

            // if the seed doesn't meet the filter, it's as
            // though no seed were set.
            if (step.seed === undefined || !step.filter(step.seed)) {
                this.folded = this.data[0];
                v = 1;
            } 
            else
                this.folded = step.seed;

            for (v; v < this.data.length; v++) 
            if (step.filter(this.data[v])) 

                // matches signature of first 'reducer' argument
                // in Array.prototype.reduce
                this.folded = step.func(
                    this.folded, // accumulator
                    this.data[v], // current value
                    v, // current index
                    this.data // source array
                );

        }

        else if (step.type == 'changeData') 
            for (let rowIx in this.data) 
                this.data[rowIx] = step.func(
                    this.data[rowIx], 
                    this.folded
                );

        
        else if (step.type == 'emulators') 
            this.folded = runEmulators(
                this.data,
                step.func 
            );

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

        // If the user passes in a singleton emulator, such 
        // as .fold(x => $$.first(x.prop)), then this needs
        // to be wrapped so we don't have to create seperate
        // logic for singletons.
        if (emulators instanceof emulator) 
            emulators = { x: emulators };

        for (let key of Object.keys(emulators)) {

            let funcName = 
                !emulators[key].funcName 
                ? folders[key]
                : emulators[key].funcName;

            if (!chosenFolders[key]) 
                chosenFolders[key] = folders[funcName].build();

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

// Because 'folders' needs functions, not folder objects
// directly, this class is created so that the user can
// create a fold function where it's creation is deferred.
export class foldBuilder {
    constructor() {
        this.funcs = [];
    }
    fold (...args) {
        this.funcs.push((val) => val.fold(...args));
        return this;
    }
    changeFolded(...args) {
        this.funcs.push((val) => val.changeFolded(...args));
        return this;
    }
    changeData(...args) {
        this.funcs.push((val) => val.changeData(...args));
        return this;
    }
    emulators(...args) {
        this.funcs.push((val) => val.emulators(...args));
        return this;
    }
    build() {
        let funcs = this.funcs;
        let val = new folder();
        for(let func of funcs) 
            val = func(val);
        return val;
    }
}

