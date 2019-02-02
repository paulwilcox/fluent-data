//import {pretendPromise} from "./pretendPromise.js";
//import {unresolvedIdb} from "./unresolvedIdb.js";
import * as g from "./general.js";
import { dsGetterIdb } from "./dsGetterIdb.js";


export let mapCore = (mappingFunction, aliases, oneQueryObj) => {
/*
    let allSelector = 
        mappingFunction == '*m' ? 'meta'
        : mappingFunction == '*d' ? 'data'
        : mappingFunction == '*' ? 'both'
        : null;

    if (allSelector) 
        return showDatabase(allSelector, oneQueryObj);
*/
    mappingFunction = 
        aliases.size > 1
        ? g.inputLiteralizer(mappingFunction)
        : mappingFunction;

    return oneQueryObj.getData(aliases) 
        .then(dataset => 
            dataset instanceof dsGetterIdb 
            ? dataset.setSelector(mappingFunction)
            : g.applyToNestedArray(dataset, array => array.map(mappingFunction))
        );

}
/*
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
*/