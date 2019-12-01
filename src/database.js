import * as g from './general.js';
import parser from './parser.js';
import dataset from './dataset.js';

export default class {

    constructor() {
        this.datasets = {};
    }

    addDataset (key, data) { 
        this.datasets[key] = Array.isArray(data) 
            ? new dataset(data) 
            : data;
        return this;
    }    

    addDatasets (obj) { 
        for (let entry of Object.entries(obj)) 
            this.addDataset(entry[0], entry[1]);
        return this;
    }

    getDataset(arg) {
        if (g.isString(arg))
            return this.datasets[arg];
        if (g.isFunction(arg)) {
            let param = parser.parameters(arg)[0];
            return this.datasets(param)[0];
        }
    }

    getDatasets(arg) {

        if (g.isString(arg))
            return [this.getDataset(arg)];

        // arg is then a function 
        let datasets = [];
        for(let param of parser.parameters(arg)) {
            let ds = this.datasets[param];
            datasets.push(ds);
        }
        return datasets;

    }

    // - execute a function on a dataset
    // - determine which datasets based on user-passed parameters to the first function.
    callOnDs(funcName, ...args) {

        // user did not pass a reciever, so make the source dataset the reciever
        if (g.isFunction(args[0])) {
            let param = parser.parameters(args[0])[0];
            args.unshift(param)
        }

        let reciever = args.shift(); // the dataset name to load the results into
        let func = args.shift(); // the first function passed by the user
        let funcDatasets = this.getDatasets(func); // the datasets referenced by that first function
        let sourceDataset = funcDatasets.shift(); // the first of these which is where we'll call the functions
        args.unshift(func); // pass the evaluated 'func' back to the front of the arguments
        funcDatasets = funcDatasets.map(ds => ds.data) // for the remaining datasets, just get the data
        args.unshift(...funcDatasets); // pass any remaining datasets to the front of the arguments
        let results = sourceDataset[funcName](...args); // execute the function
        this.datasets[reciever] = results; // load the results into the reciever dataset
        return this;  // fluently exit 

    }

}
