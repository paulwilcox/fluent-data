import * as general from "./general.js";
import { hashBuckets } from "./hashBuckets.js";
import { joiner } from "./join.js";
import { quicksort } from "./sorts.js";
import { unresolvedIdb } from "./unresolvedIdb.js";
import { pretendPromise } from "./pretendPromise.js";
import { database } from "./database.js";
import { addStaticFolds } from "./folds.js";
import { mapCore } from "./map.js";
import { print } from "./visualizer/printer.js";
import { mergeIntoIdb, mergeIntoDataset } from "./merge.js";

export let $$ = (obj) => new oneQuery(obj);

export function oneQuery (obj) { 

    // run at the bottom
    let constructor = obj => 
        this.addSources(obj);

    // careful, the collection or any element might be 
    // in either a promised or resolved state
    this.database = new database();
    
    // example: 
    //   { 
    //       dbA: { dbType: 'idb', dataBase: unresolvedIdb },
    //       dbB: { dbType: 'idb', dataBase: dbPromise }
    //   }
    this.externalDbs = {};   
        
    // If it's a first filter, leave it unresolved, otherwise 
    // resolve it.
    // 
    // This all assumes this.datasets.get() works by reference, which I think it does.
    this.getDataset = (aliases, callingFunctionIsAFilter = false) => { 

        let dataset = this.database.get(aliases);

        if (!dataset) {
            console.trace();
            throw `could not find key: ${Array.from(aliases)}`;
        }

        dataset =
            dataset
            .then(dataset => {  

                let datasetAlreadyResolved = !(dataset instanceof unresolvedIdb);
                let filterExplicitlySet = dataset.explicitFilter != null;
                let datasetReadyToResolve = filterExplicitlySet || !callingFunctionIsAFilter;

                return datasetAlreadyResolved ? dataset 
                    : datasetReadyToResolve ? dataset.resolve() 
                    : dataset;

            });

        return dataset;

    }

    this.addSources = obj => {

        let makeUnresolvedIdb = (datasetName, database) => 
            database
            .then (db => {
                let tx = db.transaction(datasetName);
                return new unresolvedIdb(datasetName, tx);
            });

        // for all database keys
        for (let key of Object.keys(obj)) 
            if (obj[key].dbType) 
                this.externalDbs[key] = obj[key]

        // for all dataset keys
        for (let key of Object.keys(obj)) 
            if (!obj[key].dbType) {

                // if value is a function, the parameter represents the database
                // the body represents the dataset name as a string
                if (general.isFunction(obj[key])) {
                    
                    let dbName = new general.parser(obj[key]).parameters[0];
                    let dsName = obj[key]();
                    let externalDb = this.externalDbs[dbName];

                    if (externalDb.dbType == 'idb')
                        obj[key] = makeUnresolvedIdb(dsName, externalDb.database);

                }

                // if not a function, it is the dataset directly
                else 
                    obj[key] = new pretendPromise(obj[key]);

                this.database.addDataset(key, obj[key]);

            }

        return this;

    }

    this.filter = condition => {

        let aliases = new Set(new general.parser(condition).parameters);
        let datasetVal = this.getDataset(aliases, true);
        
        if (aliases.size > 1)
            condition = general.inputLiteralizer(condition);

        let filterIt = array => {

            let filteredResults = [];

            for(let record of array) 
                if (condition(record)) 
                    filteredResults.push(record);

            return filteredResults;

        };

        datasetVal = 
            datasetVal 
            .then(dataset => 

                dataset instanceof unresolvedIdb
                ? dataset.setFilter(condition)
                : general.applyToNestedArray(dataset, filterIt)

            );

        return this;

    }

    this.fold = (...args) => {

        // Initializations

            let newAlias = args.length > 1 ? args[0] : null;
            let funcsObject = args.length > 1 ? args[1] : args[0];

        // Get the relevant dataset

            let datasetKey = new Set(); 

            for (let func of Object.values(funcsObject)) { 
                let firstStoredArgument = func.storedArguments[0];
                datasetKey.add(
                    ...new general.parser(firstStoredArgument).parameters
                );
            }
                
            datasetKey = this.database.getFullKey(datasetKey);

            let datasetVal = this.getDataset(datasetKey);

        // Loop args and literalize any functions if necessary

            for (let funcKey of Object.keys(funcsObject)) 
            for (let argIx in funcsObject[funcKey].storedArguments) {

                let arg = funcsObject[funcKey].storedArguments[argIx];

                if (typeof arg != 'function')
                    continue;
                
                let argParams = new general.parser(arg).parameters;
                let argReferencesDataset = argParams.some(param => datasetKey.has(param));

                if (argReferencesDataset && datasetKey.size > 1) 
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

        // Execute that function on the dataset

            datasetVal = 
                datasetVal
                .then(dataset => 
                    general.applyToNestedArray(
                        dataset,
                        applyFunctions
                    )
                );

        // Terminations

            if (newAlias == null)
                return datasetVal;

            this.database.addDataset(
                datasetKey, 
                datasetVal,
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

        let datasetVal = 
            mapCore(
                mappingFunction,
                oldAliases,
                this
            );

        if (newAlias == null)
            return safeExecutedataset(datasetVal);

        this.database.addDataset(
            oldAliases,
            datasetVal,
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

        let fromFullKey = this.database.getFullKey(new Set(fromAliases));

        let resultKey = new Set(fromFullKey);
        resultKey.add(joinAlias);

        let fromdataset = this.getDataset(fromFullKey);
        let joindataset = this.getDataset(new Set([joinAlias]));

        let resultdataset = 
            pretendPromise.all([fromdataset,joindataset])
            .then(datasets => 
                
                general.applyToNestedArray(
                    datasets[0], 
                    array => 
                        new joiner (
                            fromFullKey,
                            joinAlias,
                            array, 
                            datasets[1], 
                            joinType
                        )
                        .executeJoin(matchingLogic)
                )
            
            );

        this.database.addDataset(resultKey, resultdataset);
        this.database.remove(fromFullKey);
        this.database.remove(new Set([joinAlias]));

        return this;

    }
   
    this.orderBy = orderedValuesSelector => {

        let key = new general.parser(orderedValuesSelector).parameters;
        key = this.database.getFullKey(new Set(key));

        orderedValuesSelector = 
              key.size > 1
            ? general.inputLiteralizer(orderedValuesSelector)
            : orderedValuesSelector;

        let dataset = this.getDataset(key);
        dataset = dataset.then(dataset => 
            general.applyToNestedArray(
                dataset,
                array => quicksort(array, orderedValuesSelector)
            )
        );

        this.database.addDataset(key, dataset);
        return this;

    } 

    this.groupBy = groupKeySelector => {
    
        let key = new general.parser(groupKeySelector).parameters;
        key = this.database.getFullKey(new Set(key));
    
        groupKeySelector = 
              key.size > 1
            ? general.inputLiteralizer(groupKeySelector)
            : groupKeySelector;
            
        let dataset = this.getDataset(key);

        dataset = dataset.then(dataset => 
            new hashBuckets(groupKeySelector)
            .addItems(dataset)
            .getBuckets()
        );

        this.database.addDataset(key, dataset);

        return this;

    }

    this.print = (mappingFunction, target, caption) => {

        this.executeAll();

        let aliases = new general.parser(mappingFunction).parameters;

        // Just print the idbdataset as a whole.
        if (Object.keys(this.externalDbs).includes(aliases[0])) {
            
            let externalDb = this.externalDbs[aliases[0]];
            let datasetName = mappingFunction();

            if (externalDb.dbType == 'idb')
                printIdbStore(datasetName, externalDb.database, target, caption);

            return this;

        }

        let dataset = this.getDataset(aliases);
        dataset = dataset.then(dataset => {
            print(target, mappingFunction(dataset), caption);
            return dataset;
        });

        return this;

    }

    let printIdbStore = (storeName, database, target, caption) => 

        database
        .then(db => {
            let tx = db.transaction(storeName);
            let store = tx.objectStore(storeName);
            return store.getAll();
        })
        .then(store => {
            print(target, store, caption);
        });

    this.merge = (
        target, // if string for an idbdataset, updates the idbObjectdataset, otherwise, updates the oneQuerydataset 
        source, // mapper function or maybe even direct array of objects  
        identityKey,
        action = () => oneQuery.mergeAction.upsert // function returning a oneQuery.mergeAction (or the direct string)
    ) => {

        let srcAliases = new general.parser(source).parameters;

        let literalizedSource = 
            this.literalizeIfNecessary(source);

        let mc = mapCore(literalizedSource, new Set(srcAliases), this);

        if (!general.isFunction(target)) {

            let targetDatasetMerged = 
                pretendPromise.all([mc, this.getDataset(target)])
                .then(obj => { 
                    let mapped = obj[0];
                    let targetDataset = obj[1];
                    let mergedTarget = mergeIntoDataset(targetDataset, mapped, identityKey, action);
                    return mergedTarget;
                })
                .execute();

            this.database.addDatasets(
                target, 
                new pretendPromise(targetDatasetMerged)
            );

        }

        else {

            let externalDb = this.externalDbs[new general.parser(target).parameters[0]];

            if (externalDb.dbType == 'idb') 
                
                // Why did I (psw) have to wrap in pretend promise to work?
                pretendPromise.all([mc]) 
                .then(obj => {
                    let mapped = obj[0];
                    mergeIntoIdb(externalDb.database, target(), mapped, identityKey, action);
                });

        }

        return this;

    }

    // Ensures all datasets have executed.  Relevant for pretend
    // promises.  Standard promises will execute on their own
    // in time.
    this.executeAll = () => {
        for (let dataset of this.database) {
            if (dataset.data instanceof pretendPromise)
                dataset.data = new pretendPromise(dataset.data.execute())
        }
        return this;
    }

    this.literalizeIfNecessary = functionToProcess => {

        let datasetKey =
            this.database.getFullKey(
                new Set (
                    new general.parser(functionToProcess).parameters
                )
            );
    
        // functionToProcess might not even be referring to a dataset;
        // That is the reason for the truthy check on it's existence.
        return datasetKey && datasetKey.size > 1 
            ? general.inputLiteralizer(functionToProcess)
            : functionToProcess;
    
    }    

    // This is a 'safe' execute function.  So if the object is
    // a full promise, it does nothing (but also does not fail),
    // and if it's a pretendPromise, it executes it to return
    // its value.
    let safeExecutedataset = maybePromise => {
        if (maybePromise instanceof pretendPromise) 
            return maybePromise.execute();
    }

    constructor(obj);

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

oneQuery.db = (database, dbType) => ({
    dbType, 
    database
});

$$.db = oneQuery.db;