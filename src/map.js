import {pretendPromise} from "./pretendPromise.js";
import {unresolvedIdb} from "./unresolvedIdb.js";
import * as general from "./general.js";


export let mapCore = (mappingFunction, aliases, oneQueryObj) => {

    let allSelector = 
        mappingFunction == '*m' ? 'meta'
        : mappingFunction == '*d' ? 'data'
        : mappingFunction == '*' ? 'both'
        : null;

    if (allSelector) 
        return showDatabase(allSelector, oneQueryObj);

    mappingFunction = 
        aliases.size > 1
        ? general.inputLiteralizer(mappingFunction)
        : mappingFunction;

    let mapFunc = mappingFunction; 

    let mapIt = array => {

        let mappedRecords = [];

        for (let record of array) 
            mappedRecords.push(
                mapFunc(record)
            );

        return mappedRecords; 

    }

    return oneQueryObj.getDataset(aliases) 
        .then(dataset => 
            dataset instanceof unresolvedIdb 
            ? dataset.setSelector(mappingFunction)
            : general.applyToNestedArray(dataset, array => mapIt(array))
        );

}

export let showDatabase = (display, oneQueryObj) => { // display = 'meta', 'data', 'both'

    let keyStrings = [];
    let datasets = [];
    let datas = [];
    let isPromiseResults = [];

    for(let dataset of oneQueryObj.database) {
        let keyString = [...dataset.key].join(',');
        keyStrings.push(keyString);
        datasets.push(dataset.data);
        datas.push(oneQueryObj.getDataset(keyString));
        isPromiseResults.push(
            Promise.resolve(dataset.data) == dataset.data
        );
    }

    return pretendPromise.all([ 
        pretendPromise.all(datasets),
        pretendPromise.all(datas)
    ])
    .then(sd => {

        let datasets = sd[0];
        let datas = sd[1];

        let newdatasets = {};

        for(let s in datasets) {           
            
            let info = {}

            if (display == 'meta' || display == 'both') {
                info['isPromise'] = isPromiseResults[s];
                info['isUnresolvedIdb'] = datasets[s] instanceof unresolvedIdb;
            }

            if (display == 'data')
                info = datas[s];
            
            if (display == 'both')
                info['data'] = datas[s];

            newdatasets = Object.assign(
                newdatasets, 
                {[keyStrings[s]]: info}
            );

        }

        return newdatasets;

    });

}