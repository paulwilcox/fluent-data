import { aggregators } from './aggregators.js';

export class aggregator {

    constructor() {
        this.data = [];
        this.aggregation;
        this.steps = [];
    }

    loadValue(value) {
        this.data.push(value);
    }

    aggregate(func, seed, filter) {
        this.steps.push({                
            func: func, 
            seed: seed,
            filter: filter || (x => true),
            type: 'aggregate'
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

    changeAggregated(func) {
        this.steps.push({
            func: func,
            type: 'changeAggregated'
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
        return this.aggregation;
    }

    applyStep (step) {

        if (step.type == 'changeAggregated') 
            this.aggregation = step.func(this.aggregation);
        
        else if (step.type == 'aggregate') {

            // Return 'null' instead of 'typeerror' (which 
            // is what Array.prototype.reduce returns)
            if (this.data.length == 0) {
                this.aggregation = null;
                return;
            }

            let v = 0; 

            // if the seed doesn't meet the filter, it's as
            // though no seed were set.
            if (step.seed === undefined || !step.filter(step.seed)) {
                this.aggregation = this.data[0];
                v = 1;
            } 
            else
                this.aggregation = step.seed;

            for (v; v < this.data.length; v++) 
            if (step.filter(this.data[v])) 

                // matches signature of first 'reducer' argument
                // in Array.prototype.reduce
                this.aggregation = step.func(
                    this.aggregation, // accumulator
                    this.data[v], // current value
                    v, // current index
                    this.data // source array
                );

        }

        else if (step.type == 'changeData') 
            for (let rowIx in this.data) 
                this.data[rowIx] = step.func(
                    this.data[rowIx], 
                    this.aggregation
                );

        
        else if (step.type == 'emulators') 
            this.aggregation = aggregator.runEmulators(
                step.func, 
                this.data
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
aggregator.emulator = class {
    constructor(rowValue, funcName) {
        this.rowValue = rowValue;
        this.funcName = funcName;
    }
}

// 'emulatorsFunc' is what the user will pass in.
aggregator.runEmulators = function (
    dataset,
    emulatorsFunc
) {

    let chosenAggregators = {};
    let isNaked = false;

    for (let row of dataset) {

        let emulators = emulatorsFunc(row);
                
        isNaked = emulators instanceof aggregator.emulator;

        if (isNaked) 
            emulators = { x: emulators };

        for (let key of Object.keys(emulators)) {

            let isEmulator = emulators[key].funcName;

            if (!isEmulator) 
                emulators[key] = $$.last(emulators[key]);

            if (!chosenAggregators[key]) 
                chosenAggregators[key] = aggregators[emulators[key].funcName]();

            chosenAggregators[key].loadValue(emulators[key].rowValue);

        }

    }

    for (let key of Object.keys(chosenAggregators)) 
        chosenAggregators[key] = chosenAggregators[key].execute();

    if (isNaked) 
        chosenAggregators = chosenAggregators.x;

    return chosenAggregators;

}
