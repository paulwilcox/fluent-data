import {pretendPromise} from "./pretendPromise.js";
import {unresolvedIdb} from "./unresolvedIdb.js";
import * as general from "./general.js";


export let mapCore = (newAlias, mappingFunction, oldAliases, lishObj) => {

    let allSelector = 
        mappingFunction == '*m' ? 'meta'
        : mappingFunction == '*d' ? 'data'
        : mappingFunction == '*' ? 'both'
        : null;

    if (allSelector)
        return showStoreInfo(allSelector, lishObj);

    mappingFunction = 
        oldAliases.size > 1
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

    return lishObj.getStore(oldAliases) 
        .then(store => 
            store instanceof unresolvedIdb 
            ? store.setSelector(mappingFunction)
            : general.applyToNestedArray(store, array => mapIt(array))
        );

}

export let showStoreInfo = (display, lishObj) => { // display = 'meta', 'data', 'both'

    let keyStrings = [];
    let stores = [];
    let datas = [];
    let isPromiseResults = [];

    for(let storeInfo of lishObj.storesBin.storeInfos) {
        let keyString = [...storeInfo.key].join(',');
        keyStrings.push(keyString);
        stores.push(storeInfo.store);
        datas.push(lishObj.getStore(keyString));
        isPromiseResults.push(
            Promise.resolve(storeInfo.store) == storeInfo.store
        );
    }

    return pretendPromise.all([ 
        pretendPromise.all(stores),
        pretendPromise.all(datas)
    ])
    .then(sd => {

        let stores = sd[0];
        let datas = sd[1];

        let newStores = {};

        for(let s in stores) {           
            
            let info = {}

            if (display == 'meta' || display == 'both') {
                info['isPromise'] = isPromiseResults[s];
                info['isUnresolvedIdb'] = stores[s] instanceof unresolvedIdb;
            }

            if (display == 'data')
                info = datas[s];
            
            if (display == 'both')
                info['data'] = datas[s];

            newStores = Object.assign(
                newStores, 
                {[keyStrings[s]]: info}
            );

        }

        return newStores;

    });

}