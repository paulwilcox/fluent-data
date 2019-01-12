import * as general from "./general.js";
import { hashBuckets } from "./hashBuckets.js";
import { joiner } from "./join.js";
import { quicksort } from "./sorts.js";
import { unresolvedIdb } from "./unresolvedIdb.js";
import { pretendPromise } from "./pretendPromise.js";
import { storesBin } from "./storesBin.js";
import { addStaticFolds } from "./folds.js";
import { mapCore } from "./map.js";
import { print } from "./visualizer/printer.js";
import { mergeIntoIdb, mergeIntoStore } from "./merge.js";

export let $$ = (...args) => new oneQuery(...args);

export function oneQuery () { 

    // careful, the collection or any element might be 
    // in either a promised or resolved state
    this.storesBin = new storesBin();

    if (arguments[1] == 'idb') 
        this.idbPromise = arguments[0];
        
    // If it's a first filter, leave it unresolved, otherwise 
    // resolve it.
    // 
    // This all assumes this.stores.get() works by reference, which I think it does.
    this.getStore = (aliases, callingFunctionIsAFilter = false) => { 

        let storeVal = this.storesBin.get(aliases);

        if (!storeVal) {
            console.trace();
            throw `could not find key: ${Array.from(aliases)}`;
        }

        storeVal =
            storeVal
            .then(store => {  

                let storeAlreadyResolved = !(store instanceof unresolvedIdb);
                let filterExplicitlySet = store.explicitFilter != null;
                let storeReadyToResolve = filterExplicitlySet || !callingFunctionIsAFilter;

                return storeAlreadyResolved ? store 
                    : storeReadyToResolve ? store.resolve() 
                    : store;

            });

        return storeVal;

    }

    this.from = userStores => {

        let makeUnresolvedIdb = storeName => 
            this.idbPromise
            .then (db => {
                let tx = db.transaction(storeName);
                return new unresolvedIdb(storeName, tx);
            });

        for (let key of Object.keys(userStores)) 
        
            userStores[key] = 
                general.isString(userStores[key]) && this.idbPromise 
                ? makeUnresolvedIdb(userStores[key])
                : new pretendPromise(userStores[key]);

        this.storesBin.set(userStores);

        return this;

    }

    this.filter = condition => {

        let aliases = new Set(new general.parser(condition).parameters);
        let storeVal = this.getStore(aliases, true);
        
        if (aliases.size > 1)
            condition = general.inputLiteralizer(condition);

        let filterIt = array => {

            let filteredResults = [];

            for(let record of array) 
                if (condition(record)) 
                    filteredResults.push(record);

            return filteredResults;

        };

        storeVal = 
            storeVal 
            .then(store => 

                store instanceof unresolvedIdb
                ? store.setFilter(condition)
                : general.applyToNestedArray(store, filterIt)

            );

        return this;

    }

    this.fold = (...args) => {

        // Initializations

            let newAlias = args.length > 1 ? args[0] : null;
            let funcsObject = args.length > 1 ? args[1] : args[0];

        // Get the relevant store

            let storeKey = new Set(); 

            for (let func of Object.values(funcsObject)) { 
                let firstStoredArgument = func.storedArguments[0];
                storeKey.add(
                    ...new general.parser(firstStoredArgument).parameters
                );
            }
                
            storeKey = this.storesBin.getFullKey(storeKey);

            let storeVal = this.getStore(storeKey);

        // Loop args and literalize any functions if necessary

            for (let funcKey of Object.keys(funcsObject)) 
            for (let argIx in funcsObject[funcKey].storedArguments) {

                let arg = funcsObject[funcKey].storedArguments[argIx];

                if (typeof arg != 'function')
                    continue;
                
                let argParams = new general.parser(arg).parameters;
                let argReferencesStore = argParams.some(param => storeKey.has(param));

                if (argReferencesStore && storeKey.size > 1) 
                    funcsObject[funcKey].storedArguments[argIx] = general.inputLiteralizer(arg);

            }

        // Create funciton that processes all partialized functions in object 

            let applyFunctions = array => {

                let output = {};

                for (let funcKey of Object.keys(funcsObject)) {
                    let func = funcsObject[funcKey].func;
                    let args = funcsObject[funcKey].storedArguments.slice(0);
                    args.unshift(array);
                    output[funcKey] = func.apply(null, args);
                }

                return output;

            };

        // Execute that function on the store

            storeVal = 
                storeVal
                .then(store => 
                    general.applyToNestedArray(
                        store,
                        applyFunctions
                    )
                );

        // Terminations

            if (newAlias == null)
                return storeVal;

            this.storesBin.set(
                storeKey, 
                storeVal,
                newAlias
            );

            return this;

    }

    // map(func)
    // map('newalias', func)
    // map('*')
    this.map = (...args) => {

        let mappingFunction = args.length > 1 ? args[1] : args[0];

        let isAllSelector = 
               general.isString(mappingFunction) 
            && mappingFunction.substring(0,1) == '*';

        let newAlias = args.length > 1 ? args[0] : null;

        let oldAliases = 
              isAllSelector ? null 
            : new Set(new general.parser(mappingFunction).parameters);

        let storeVal = 
            mapCore(
                mappingFunction,
                oldAliases,
                this
            );

        if (newAlias == null)
            return safeExecuteStore(storeVal);

        this.storesBin.set(
            oldAliases,
            storeVal,
            newAlias
        );

        return this;

    }

    joiner.forEachJoinType(joinType => { 

        // for the sake of: 
        //   ...leftJoin(arrowFunc)
        this[joinType + 'Join'] = 
            (matchingLogic, algorithm = 'default') => {
                this.join({joinType, matchingLogic, algorithm});
                return this;
            };

    })    

    this.join = (...commands) => {

        for (let command of commands) {
                
            if(typeof command == 'function')
                command = { 
                    joinType: 'inner', 
                    matchingLogic: command,
                    algorithm: 'default'
                };

            joinRecords(
                command.matchingLogic, 
                command.joinType
            );

        }

        return this;

    }

    let joinRecords = (
        matchingLogic, // (f,j) => [f.col1 == j.col1, f.col2 < j.col2],
        joinType // "inner", "left", "right", "full"
    ) => {

        let aliases = new general.parser(matchingLogic).parameters;
        let fromAliases = Array.from(aliases);
        let joinAlias = fromAliases.pop();

        let fromFullKey = this.storesBin.getFullKey(new Set(fromAliases));

        let resultKey = new Set(fromFullKey);
        resultKey.add(joinAlias);

        let fromStore = this.getStore(fromFullKey);
        let joinStore = this.getStore(new Set([joinAlias]));

        let resultStore = 
            pretendPromise.all([fromStore,joinStore])
            .then(stores => 
                
                general.applyToNestedArray(
                    stores[0], 
                    array => 
                        new joiner (
                            fromFullKey,
                            joinAlias,
                            array, 
                            stores[1], 
                            joinType
                        )
                        .executeJoin(matchingLogic)
                )
            
            );

        this.storesBin.set(resultKey, resultStore);
        this.storesBin.remove(fromFullKey);
        this.storesBin.remove(new Set([joinAlias]));

        return this;

    }
   
    this.orderBy = orderedValuesSelector => {

        let key = new general.parser(orderedValuesSelector).parameters;
        key = this.storesBin.getFullKey(new Set(key));

        orderedValuesSelector = 
              key.size > 1
            ? general.inputLiteralizer(orderedValuesSelector)
            : orderedValuesSelector;

        let store = this.getStore(key);
        store = store.then(store => 
            general.applyToNestedArray(
                store,
                array => quicksort(array, orderedValuesSelector)
            )
        );

        this.storesBin.set(key, store);
        return this;

    } 

    this.groupBy = groupKeySelector => {
    
        let key = new general.parser(groupKeySelector).parameters;
        key = this.storesBin.getFullKey(new Set(key));
    
        groupKeySelector = 
              key.size > 1
            ? general.inputLiteralizer(groupKeySelector)
            : groupKeySelector;
            
        let store = this.getStore(key);

        store = store.then(store => 
            new hashBuckets(groupKeySelector)
            .addItems(store)
            .getBuckets()
        );

        this.storesBin.set(key, store);

        return this;

    }

    this.print = (mappingFunction, target, caption) => {

        this.executeAll();

        // Just print the idbStore as a whole.
        if (general.isString(mappingFunction)) {
            printIdbStore(mappingFunction, target, caption);
            return this;
        }

        let aliases = new Set(new general.parser(mappingFunction).parameters);

        let store = this.getStore(aliases);
        store = store.then(store => {
            print(target, mappingFunction(store), caption);
            return store;
        });

        return this;

    }

    let printIdbStore = (storeName, target, caption) => 

        this.idbPromise
        .then(db => {
            let tx = db.transaction(storeName);
            let store = tx.objectStore(storeName);
            return store.getAll();
        })
        .then(storeVals => {
            print(target, storeVals, caption);
        });

    this.merge = (
        target, // if string for an idbStore, updates the idbObjectStore, otherwise, updates the oneQueryStore 
        source, // mapper function or maybe even direct array of objects  
        identityKey,
        action = () => oneQuery.mergeAction.upsert // function returning a oneQuery.mergeAction (or the direct string)
    ) => {

        let srcAliases = new Set(new general.parser(source).parameters);

        let literalizedSource = 
            this.literalizeIfNecessary(source);

        let targetInStoresBin =
            this.storesBin.getFullKey(target)
            ? true
            : false;     

        let mc = mapCore(literalizedSource, srcAliases, this);

        if (targetInStoresBin) {

            let targetStoreMerged = 
                pretendPromise.all([mc, this.getStore(target)])
                .then(obj => { 
                    let mapped = obj[0];
                    let targetStore = obj[1];
                    let mergedTarget = mergeIntoStore(targetStore, mapped, identityKey, action);
                    return mergedTarget;
                })
                .execute();

            this.storesBin.set(
                target, 
                new pretendPromise(targetStoreMerged)
            );

        }

        else {

            // Why did I (psw) have to wrap in pretend promise to work?
            // Before I did that, I of course didn't need execute, but
            // the source store would be whatever the output of .then was.
            // Originally undefined, but if I returned 'hello', it would 
            // be 'hello'.  
            pretendPromise.all([mc]) 
            .then(obj => {
                let mapped = obj[0];
                mergeIntoIdb(this.idbPromise, target, mapped, identityKey, action);
            })
            .execute();

        }

        return this;

    }

    // Ensures all stores have executed.  Relevant for pretend
    // promises.  Standard promises will execute on their own
    // in time.
    this.executeAll = () => {
        for (let storeInfo of this.storesBin.storeInfos) {
            let store = storeInfo.store;
            if (store instanceof pretendPromise)
                storeInfo.store = new pretendPromise(store.execute())
        }
        return this;
    }

    this.literalizeIfNecessary = functionToProcess => {

        let storeKey =
            this.storesBin.getFullKey(
                new Set (
                    new general.parser(functionToProcess).parameters
                )
            );
    
        // functionToProcess might not even be referring to a store;
        // That is the reason for the truthy check on it's existence.
        return storeKey && storeKey.size > 1 
            ? general.inputLiteralizer(functionToProcess)
            : functionToProcess;
    
    }    

    // This is a 'safe' execute function.  So if the object is
    // a full promise, it does nothing (but also does not fail),
    // and if it's a pretendPromise, it executes it to return
    // its value.
    let safeExecuteStore = maybePromise => {
        if (maybePromise instanceof pretendPromise) 
            return maybePromise.execute();
    }

}

addStaticFolds(oneQuery);
addStaticFolds($$);

// for the sake of: 
//   ...join($$.left(arrowFunc), $$.inner(arrowFunc))  
joiner.forEachJoinType(joinType => {

    oneQuery[joinType] = (matchingLogic, algorithm = 'default') => ({
        joinType: joinType,
        matchingLogic,
        algorithm
    });     

    $$[joinType] = oneQuery[joinType];

})

oneQuery.mergeAction = Object.freeze({
    nothing: null,
    upsert: 'upsert',
    remove: 'remove'
})


