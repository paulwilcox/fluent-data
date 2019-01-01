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

export function lish () { 

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

    // MinusFour and kofifus stackoverflow.com/questions/32539354/how 
    //   -to-get-the-first-element-of-set-in-es6-ecmascript-2015
    this.from = stores => {

        this.storesBin.set(stores);

        for (let storeInfo of this.storesBin.storeInfos) {

            let storeInInput = this.storesBin.isSubsetOf(storeInfo.key, Object.keys(stores));

            if (!storeInInput)
                continue;

            if (general.isString(storeInfo.store) && this.idbPromise)
                storeInfo.store = lish.idbSource(storeInfo.store, this.idbPromise);

            storeInfo.store = 
                storeInfo.store instanceof lish.idbSourceManager 
                ? storeInfo.store = storeInfo.store.getStorePromise()
                : new pretendPromise(storeInfo.store);

        }

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
        let newAlias = args.length > 1 ? args[0] : null;
        let oldAliases = new Set(new general.parser(mappingFunction).parameters);

        let storeVal = 
            mapCore(
                newAlias, 
                mappingFunction,
                oldAliases,
                this
            );

        if (newAlias == null)
            return this.safeExecute(storeVal);

        this.storesBin.set(
            oldAliases,
            storeVal,
            newAlias
        );

        return this;

    }

    this.join = (...matchingLogicObjects) => {

        for (let mlObj of matchingLogicObjects) {
                
            if(typeof mlObj == "function")
                mlObj = { inner: mlObj };

            let mlProp = 
                Object.entries(mlObj)
                .find(kv => 
                    ['inner', 'left','right','full']
                    .includes(kv[0].toLowerCase())
                );

            let joinType = mlProp[0];
            let matchingLogic = mlProp[1]; 

            joinRecords(matchingLogic, joinType);

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

        // if mappingFunction is just a store name, then 
        // the user wants to print an idb object, not a
        // lish object.
        if (general.isString(mappingFunction)) {
            
            let storeName = mappingFunction;

            this.idbPromise
            .then(db => {
                let tx = db.transaction(storeName);
                let store = tx.objectStore(storeName);
                return store.getAll();
            })
            .then(storeVals => {
                print(target, storeVals, caption);
            });

            return this;

        }

        let aliases = new Set(new general.parser(mappingFunction).parameters);

        let mc = mapCore(null, mappingFunction, aliases, this);

        // fixme: When just pretend promises, then the lish instance seems
        // to loose all it's built up 'then' functions and starts over.  I
        // believe the issue is the construction of pretendPromise.all, which
        // passes the working objects but not the functions.
        if (mc instanceof pretendPromise) 
            /* pretendPromise.all([
                this.getStore(aliases),
                mc
            ])
            .then(obj => {
                print(target, obj[1], caption);
                return obj[0];
            }) */
            //.execute();

            {
                
                let ppa = pretendPromise.all([
                    this.getStore(aliases),
                    mc
                ]);

                console.log({ppa, mc})

            }

        else 

            mc
            .then(mapped => print(target, mapped, caption))


        return this;

    }

    this.merge = (
        target, // if string for an idbStore, updates the idbObjectStore, otherwise, updates the lishStore 
        source, // mapper function or maybe even direct array of objects  
        identityKey,
        action = () => lish.mergeAction.upsert // function returning a lish.mergeAction (or the direct string)
    ) => {

        let srcAliases = new Set(new general.parser(source).parameters);

        let literalizedSource = 
            this.literalizeIfNecessary(source);

        let targetInStoresBin =
            this.storesBin.getFullKey(target)
            ? true
            : false;     

        let mc = mapCore(null, literalizedSource, srcAliases, this);

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
    this.safeExecute = maybePromise => {
        if (maybePromise instanceof pretendPromise) 
            return maybePromise.execute();
    }

}

addStaticFolds(lish);

lish.mergeAction = Object.freeze({
    nothing: null,
    upsert: 'upsert',
    remove: 'remove'
})

lish.idbSource = (storeName, dbPromise) => 
    new lish.idbSourceManager(storeName, dbPromise);

lish.idbSourceManager = class {
    
    constructor(storeName, dbPromise) {
        this.storeName = storeName;
        this.dbPromise = dbPromise;
    }
    
    getStorePromise () { 

        return this.dbPromise
        .then (db => {
            let tx = db.transaction(this.storeName);
            return new unresolvedIdb(this.storeName, tx);
        });
    
    }

}
