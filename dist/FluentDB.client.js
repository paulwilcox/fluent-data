/**
 * ISC License (ISC)
 * Copyright (c) 2019, Paul Wilcox <t78t78@gmail.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

// rowMaker takes the passed in parameters 
// and turns the into a row in the dataset.
// In other words, it will shape your rows.
let reducer = (obj, name, rowMaker, processor) => {
    let p = processor;
    obj[name] = (...vals) => new emulator(p, rowMaker(...vals));
    return p;
};

// Aggregators such as 'sum' or 'avg' operate on
// columnar data.  But the values passed to the
// aggregators, such as 'x' in 'sum(x)' or 'avg(x)'
// are point data.  'emulator' stores the row value,
// but it also stores the the intented function (the 
// one it emulates), for later loading into a master 
// aggregators object.    
class emulator {
    constructor(processor, rowValue) {
        this.rowValue = rowValue;
        this.processor = processor;
    }
}

// 'emulatorsFunc' is what the user will pass in.
let runEmulators = function (
    dataset,
    emulatorsFunc
) {

    let keyStores = {};
    let isNaked = false;

    for (let row of dataset) {

        let emulators = emulatorsFunc(row);
        
        if (emulators instanceof emulator) {
            isNaked = true;
            emulators = { x: emulators };
        }

        for (let key of Object.keys(emulators)) {

            let rowValue = emulators[key].rowValue;

            if (!keyStores[key]) 
                keyStores[key] = {
                    processor: emulators[key].processor,
                    data: []
                };

            keyStores[key].data.push(rowValue);

        }

    }

    for (let key of Object.keys(keyStores)) 
        keyStores[key] = keyStores[key].processor(keyStores[key].data);

    if (isNaked)
        keyStores = keyStores.x;

    return keyStores;

};

class connector {

    import() { throw "Please override 'import'." }
    merge() { throw "Please override 'merge'." }

}

let stringifyObject = obj => {

    // todo: find out if this is bad.  But for now it's
    // fixing something.
    if (obj === undefined) 
        return '';

    let isObject = variable => 
           variable 
        && typeof variable === 'object' 
        && variable.constructor === Object;

    if (!isObject(obj))
        return obj.toString();

    let stringified = '[';

    let keys = Object.keys(obj).sort();

    for (let key of keys) {
        let val = obj[key];
        let valToStringify = isObject(val) ? stringifyObject(val) : val;
        stringified += `[${key},${valToStringify}]`;
    }

    return stringified + ']';

};

let isString = input =>
    typeof input === 'string' 
    || input instanceof String;

let isFunction = input => 
    typeof input === 'function';

let noUndefinedForFunc = mapper =>

    (...args) => {
        let result = mapper(...args);
        return noUndefined(result);
    };

let noUndefined = obj => {
    
    for(let key of Object.keys(obj))
        if (obj[key] === undefined) 
            delete result[key];

    return obj;

};

class hashBuckets extends Map {
    
    constructor (
        hashKeySelector,
        distinct = false
    ) {
        super();
        this.distinct = distinct;
        this.hashKeySelector = hashKeySelector;
    }
 
    addItems(items) {
        for(let item of items) 
            this.addItem(item);
        return this;
    }

    addItem(item) {

        let key = this.hashKeySelector(item);
        if (!isString(key))
            key = stringifyObject(key);

        if (this.distinct) {
            this.set(key, [item]);
            return this;
        }

        if(!this.has(key))
            this.set(key, []);

        this.get(key).push(item);

        return this;

    }

    getBucket(
        objectToHash, 
        hashKeySelector
    ) {
        let key = hashKeySelector(objectToHash);
        if (!isString(key))
            key = stringifyObject(key);
        return this.get(key);
    }

    getBuckets() {
        return Array.from(this.values());
    }

    * crossMapRow(incomingRow, hashKeySelector, mapper) {

        let existingRows = this.getBucket(incomingRow, hashKeySelector);                

        if (existingRows === undefined)
            existingRows = [undefined];

        for(let existingRow of existingRows) {

            let mapped = mapper(existingRow, incomingRow);

            if (Array.isArray(mapped)) {
                for (let entry of mapped) 
                    if (entry !== undefined) 
                        yield entry;
            }
                        
            else if (mapped !== undefined) 
                yield mapped;

        }

    }
    
}

// TODO: See if we need to uncomment the falsy checks below.
// I ran orderby without them and surprisingly, it did not 
// fail, though I don't know if the ordering comes out as 
// desired.
//
// orderedValuesSelector accepts a single function that selects 
// values from an object "{}" and returns an array "[]"
let quickSort = (unsorted, orderedValuesSelector) => {

    if (unsorted.length <= 1) 
        return unsorted;

    let pivot = unsorted.pop();
    let left = []; 
    let right = [];

    for (let row of unsorted) {

        let orderDecision = 
            decideOrder(
                orderedValuesSelector(row), 
                orderedValuesSelector(pivot)
            );

        orderDecision == -1
            ? left.push(row) 
            : right.push(row);

    }

    return quickSort(left, orderedValuesSelector)
        .concat([pivot])
        .concat(quickSort(right, orderedValuesSelector));

};

/*
    Take two points or arrays of values.  Compare the 
    first value in each for <, >, or =.  If < or >, then 
    that's your result.  If =, then compare the second 
    value in each array.  Only if all are =, then output =.  
    As usual -1, 0, and 1 correspond to <, =, > respectively.
    Valid < invalid (e.g. "x" < undefined) (but is this 
    going to kill performance?)
*/  
let decideOrder = (
    leftVals,
    rightVals
) => {

    if (!Array.isArray(leftVals))
        leftVals = [leftVals];

    if (!Array.isArray(rightVals))
        rightVals = [rightVals];
        
    let length = 
            leftVals.length > rightVals.length
        ? leftVals.length
        : rightVals.length;

    for(let i = 0; i < length; i++) {

        let leftVal = leftVals[i];
        let rightVal = rightVals[i];

        //let isLeftValid = leftVal === 0 || leftVal === false || Boolean(leftVal);
        //let isRightValid = rightVal === 0 || rightVal === false || Boolean(rightVal);

        //if (isLeftValid && !isRightValid) return -1
        //if (!leftValid && isRightValid) return 1;
        if (leftVal < rightVal) return -1;
        if (rightVal < leftVal) return 1;

    }

    return 0;

};

class parser {

    // Parse function into argument names and body
    constructor (func) {

        this.parameters = [];
        this.body = "";

        let lr = this.splitLeftAndRight(func);

        this.parameters = 
            lr.left
            .replace(/[()\s]/g, '')
            .split(',');

        this.body =
            lr.right
            .replace(/^\s*\{|\}\s*$/g,'')
            .replace(/^\s*|\s*$/g,'');

    }

    splitLeftAndRight (func) {

        let uncommented = 
            func.toString() 
            .replace(/[/][/].*$/mg,'') // strip single-line comments
            .replace(/[/][*][^/*]*[*][/]/g, ''); // strip multi-line comments  
	
        let arrowIx = uncommented.indexOf('=>');
        let braceIx = uncommented.indexOf('{');	

        if (arrowIx == -1 && braceIx == -1) {
            console.trace();
            throw "it seems that a non-function was passed to 'parser'";
        }

        let splitIx = 
            braceIx == -1 ? arrowIx
            : arrowIx == -1 ? braceIx
            : arrowIx < braceIx ? arrowIx 
            : braceIx;

        let isArrow = splitIx == arrowIx;

        let left = uncommented.slice(0,splitIx);
        let right = uncommented.slice(splitIx);

        if(isArrow)
            right = right.slice(2); // get rid of the arrow
        else {
            let parenIx = left.indexOf('(');
            left = left.slice(parenIx);
        }
        
        return { left, right };

    }

}

parser.parse = function (func) {
    return new parser(func);
};

parser.parameters = function(func) {
    return new parser(func).parameters;
};

// Converts (v,w) => v.a = w.a && v.b == w.b 
// into v => { x0 = v.a, x1 = v.b }
// and w => { x0 = w.a, x1 = w.b }
parser.pairEqualitiesToObjectSelectors = function(func) {

    let parsed = new parser(func);
    let leftParam = parsed.parameters[0];
    let rightParam = parsed.parameters[1];
    let leftEqualities = [];
    let rightEqualities = [];
    let splitBodyByAnds = parsed.body.split(/&&|&/);

    for (let aix in splitBodyByAnds) {

        let andPart = splitBodyByAnds[aix];
        let eqParts = andPart.split(/===|==|=/);
        let leftEq;
        let rightEq;

        if (eqParts.length != 2)
            return;

        for (let eix in eqParts) {

            let ep = eqParts[eix].trim();

            if (/[^A-Za-z0-9_. ]/.test(ep)) 
                return;

            if (ep.startsWith(`${leftParam}.`))
                leftEq = ep;
            else if (ep.startsWith(`${rightParam}.`))
                rightEq = ep;
            else
                return; 

        }	    

        leftEqualities[aix] = `x${aix}: ${leftEq}`;
        rightEqualities[aix] = `x${aix}: ${rightEq}`;

    }

    return {
        leftFunc: new Function(leftParam, `return { ${leftEqualities.join(', ')} };`),
        rightFunc: new Function(rightParam, `return { ${rightEqualities.join(', ')} };`)
    };

};

let mergeMethod = {
    hash: 'hash',
    loop: 'loop',
    hashDistinct: 'hashDistinct'
};

function* merge (
    leftData, 
    rightData, 
    matcher, 
    mapper, 
    method
) {

    let leftHasher;
    let rightHasher;
    let _mapper = normalizeMapper(mapper, matcher);

    if (method && !Object.keys(mergeMethod).includes(method)) throw `
        method '${method}' is not recognized.  Leave undefined or
        use one of: ${Object.keys(mergeMethod).join(', ')}.
    `;

    if (!isFunction(mapper) && !isString(mapper)) {
        leftHasher = mapper.leftHasher;
        rightHasher = mapper.rightHasher;
    }
    else {
        let hashers = parser.pairEqualitiesToObjectSelectors(matcher);
        if (hashers == undefined && !method) 
            method = 'loop';
        else if (hashers == undefined && method == 'hash') throw ` 
            Cannot hash merge, "${matcher.toString()}" could 
            not be parsed into functions that return objects 
            for hashing.'`;
        else {
            leftHasher = hashers.leftFunc;
            rightHasher = hashers.rightFunc;
        }
    }

    // If no hashers are passed, then do full-on loop join
    if (method == 'loop') {
        yield* loopMerge(leftData, rightData, matcher, _mapper);
        return;
    }

    if (!method || ['hash', 'hashDistinct'].includes(method))
        yield* hashMerge(
            leftData, 
            rightData,
            matcher,
            leftHasher, 
            rightHasher,
            _mapper, 
            method == 'hashDistinct' 
        );

}

function* hashMerge (
    leftData, 
    rightData, 
    matcher,
    leftHasher,
    rightHasher,
    mapper,
    hashDistinct
) {

    let leftBuckets = 
        new hashBuckets(leftHasher, hashDistinct)
        .addItems(leftData);

    let rightBuckets = 
        new hashBuckets(rightHasher, hashDistinct)
        .addItems(rightData);

    // convenience function for extracting a bucket
    let removeBucket = (buckets, key) => {
        let bucket = buckets.get(key);
        buckets.delete(key);
        return bucket;
    };

    // yield matches and left unmatched
    for(let key of leftBuckets.keys()) 
        yield* loopMerge(
            removeBucket(leftBuckets, key), 
            removeBucket(rightBuckets, key) || [undefined], 
            matcher, 
            mapper
        );

    // yield right unmatched
    for(let key of rightBuckets.keys()) 
        for(let rightItem of removeBucket(rightBuckets, key)) {
            let mapped = mapper(undefined, rightItem);
            if (mapped)
                yield mapped;
        }

}

function* loopMerge (
    leftData, 
    rightData,
    matcher,
    mapper
) {

    let leftHits = new Set();
    let rightHits = new Set();

    for (let l in leftData)
    for (let r in rightData) {
        let leftItem = leftData[l];
        let rightItem = rightData[r];
        if (leftItem == undefined || rightItem == undefined)
            continue;
        if (matcher(leftItem, rightItem)) {
            leftHits.add(l);
            rightHits.add(r);
            let mapped = mapper(leftItem, rightItem);
            if (mapped)
                yield mapped;
        }
    }

    for (let l in leftData) {
        if (leftHits.has(l))
            continue;
        let mapped = mapper(leftData[l], undefined);
        if (mapped)
            yield mapped;
    }

    for (let r in rightData) {
        if (rightHits.has(r))
            continue;
        let mapped = mapper(undefined, rightData[r]);
        if (mapped)
            yield mapped;
    }

}

function normalizeMapper (mapFunc, matchingLogic) {

    if (!mapFunc)
        mapFunc = 'both null'; // inner join by default

    if (isString(mapFunc)) {

        let keywords = mapFunc.split(' ');
        let onMatched = keywords[0];
        let onUnmatched = keywords[1];
        let allowedTerms = ['both', 'thob', 'left', 'right', 'null', 'stack'];

        if (!allowedTerms.includes(onMatched) || !allowedTerms.includes(onUnmatched))
            throw `mapper must be one of: ${allowedTerms.join(',')}}`;

        return (left,right) => mergeByKeywords(left, right, onMatched, onUnmatched);

    }

    if (!parametersAreEqual(matchingLogic, mapFunc))
        throw 'Cannot merge.  Parameters for "mapper" and "matchingLogic" do not match"';

    return mapFunc;

}

function mergeByKeywords (left, right, onMatched, onUnmatched) {

    if(left && right)
        switch(onMatched) {
            case 'both': return noUndefined(Object.assign({}, right, left));
            case 'thob': return noUndefined(Object.assign({}, left, right));
            case 'left': return left;
            case 'right': return right;
            case 'null': return undefined;
            case 'stack': return [left, right]; 
        }

    switch(onUnmatched) {
        case 'both': return left || right;
        case 'thob': return left || right; 
        case 'left': return left;
        case 'right': return right;
        case 'null': return undefined;
    }

}

function parametersAreEqual (a,b) {

    a = parser.parameters(a);
    b = parser.parameters(b);

    if (a.length != b.length)
        return false;

    for(let i in a)
        if (a[i] != b[i])
            return false;

    return true;

}

class dataset {

    constructor(data) {
        this.data = data;
    }

    map (func) {    
        return new dataset(recurse (
            data => data.map(noUndefinedForFunc(func)),
            this.data, 
        ));
    }

    filter (func) {    
        return new dataset(recurse (
            data => data.filter(func),
            this.data, 
        ));
    }

    sort (func) {

        let params = parser.parameters(func);

        let outerFunc = 
            params.length > 1 
            ? data => data.sort(func)
            : data => quickSort(data, func);
        
        return new dataset(
            recurse(outerFunc, this.data)
        );

    } 

    group (func) {
        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets();
        return new dataset(
            recurse(outerFunc, this.data)
        );
    }

    ungroup (func) {
        return new dataset(
            recurseForUngroup(func, this.data)
        );
    }

    reduce (func) {
        let outerFunc = data => runEmulators(data, func);
        return new dataset( 
            recurse(outerFunc, this.data)
        );
    }    

    distinct (func) {
        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets()
            .map(bucket => func(bucket[0]));
        return new dataset(
            recurse(outerFunc, this.data)
        );
    }

    merge (incoming, matchingLogic, mapper, distinct) {
        return new dataset([...merge (
            this.data, 
            incoming, 
            matchingLogic, 
            mapper, 
            distinct
        )]);
    }

    // TODO: with the addition of .with(), does it 
    // make sense to have print anymore?
    print (func, caption) {

        let data = recurse (
            data => data.map(noUndefinedForFunc(func)),
            this.data, 
        ).data;

        if(caption)
            console.log(caption, data); 
        else 
            console.log(data); 

        return this;
        
    }

    get (func) {
        return this.map(func).data;
    }

    with (func) {
        func(this.data);
        return this;
    }

}

function recurse (func, data) {

    let output = [];
    let isEnd = 
        Array.isArray(data) && 
        !Array.isArray(data[0]);

    if (!isEnd) {
        for (let item of data)
            output.push(recurse(func, item));
        return output;
    }
    else 
        return func(data);

}

function recurseForUngroup (func, data) {
        
    let output = [];            
    let isEnd = 
        Array.isArray(data) &&
        Array.isArray(data[0]) && 
        !Array.isArray(data[0][0]);
            
    if (!isEnd) 
        for (let item of data)
            output.push(recurseForUngroup(func, item));
    else 
        for (let item of data)
        for (let nested of item)
            output.push(func(nested));
    
    return output;

}

class connectorIdb extends connector {

    constructor (storeName, dbName) {
        super();
        this.dbName = dbName;
        this.storeName = storeName;
    }

    // A converter to a dataset for consumption in FluentDB
    import(mapFunc, filterFunc) {

        filterFunc = filterFunc || (x => true);                
        let results = [];

        return this.curse(cursor => {

            if (!cursor) 
                return new dataset(results);

            if (filterFunc(cursor.value))
                results.push(
                    mapFunc(cursor.value)
                );

            cursor.continue();

        });

    }

    print(mapFunc, caption) {
            
        let results = [];

        return this.curse(cursor => {

            if (!cursor) {
                // TODO: Do I need to implement .with() here?
                caption 
                    ? console.log(caption, results) 
                    : console.log(results);
                return this;
            }             

            results.push(
                mapFunc(cursor.value)
            );

            cursor.continue();

        });

    }

    merge (
        incoming, 
        matchingLogic, 
        mapFunc, 
        distinct = false
    ) {

        let keyFuncs = parser.pairEqualitiesToObjectSelectors(matchingLogic);
        let targetKeyFunc = keyFuncs.leftFunc;
        let sourceKeyFunc = keyFuncs.rightFunc;    
        let rowsToAdd = []; 
        let processedTargets = new hashBuckets(targetKeyFunc, true);
        let mapper = normalizeMapper(mapFunc);

        let incomingBuckets = 
            new hashBuckets(sourceKeyFunc, distinct)
            .addItems(incoming);

        return this.curse((cursor, store) => {

            // When you've finished looping the target, add 
            // any excess rows to the store.  Then resolve. 
            if (!cursor) {        
                console.log({rowsToAdd});                   
                for(let row of rowsToAdd) {
                    let addRequest = store.add(row);
                    addRequest.onerror = event => { 
                        throw event.target.error; 
                    }; 
                }
                return this;
            }

            // If user wants distinct rows in the target, then
            // track if such a row has already been processed.
            // If so, delete future rows in the target.  If not,
            // just record that it has now been processed.
            if (distinct) {  
                let processedTarget = processedTargets.getBucket(cursor.value, targetKeyFunc);
                if (processedTarget) {
                    cursor.delete();
                    cursor.continue();
                    return;
                }
                processedTargets.addItem(cursor.value);
            }

            // Finds the bucket of incoming rows matching the 
            // target and 'crossMaps' them.  Returns a generator. 
            let outputGenerator = incomingBuckets.crossMapRow(
                cursor.value, 
                targetKeyFunc,
                mapper
            );

            // For the first match, delete or update. based on
            // whether there's a match or not.
            let outputYield = outputGenerator.next();

            try {
                outputYield.done 
                    ? cursor.delete()
                    : cursor.update(outputYield.value);
            }
            catch(err) {
                let isKeyError = 
                    err.message.includes('cursor uses in-line keys')
                    && err.message.includes('different value than the cursor\'s effective key');
                if (!isKeyError)
                    throw err;
                let newErr = new Error(
                    'The error message below means that you are trying ' + 
                    'to update a row in IndexedDB with another row ' + 
                    'where the primary keys are not the same.  Are ' +
                    'you matching on keys with different names?  If so ' +
                    'try changing the name (using .map()) of the incoming ' +
                    'foreign key to match the target\'s primary key. \n\n' +
                    'Otherwise, play around with the in-line/out-of-line ' +
                    'and auto-incrementing features of your store.  And ' +
                    'it may also be possible that in its present state, ' +
                    'this library cannot support the structure of your ' +
                    'store. \n\n-- expand to see stack --\n\n' + 
                    '------------- \n\n' +
                    err.message
                );
                newErr.originalError = err;
                throw newErr;
            }

            // For additional matches, add them to the rowsToAdd array.
            outputYield = outputGenerator.next();
            while (outputYield.done === false) {
                rowsToAdd.push(outputYield.value); // I (psw) don't know if store.add is safe here
                outputYield = outputGenerator.next();
            }

            cursor.continue();

        }, 'readwrite');
        
    }
    
    curse ( 
        func,
        transactionMode = 'readonly'
    ) {

        return new Promise((resolve, reject) => {

            let dbCon = window.indexedDB.open(this.dbName);
            dbCon.onerror = event => reject(event); 
    
            dbCon.onsuccess = () => {
    
                let db = dbCon.result;
                let tx;
                
                try {
                    tx = db.transaction(this.storeName, transactionMode);
                }
                catch(err) {
                    throw err.name == "NotFoundError" 
                        ? `${this.storeName} not found in ${this.dbName}`
                        : err
                }

                tx.oncomplete = () => db.close();
                tx.onerror = event => reject(event); 
    
                let store = tx.objectStore(this.storeName);
    
                let storeCursor = store.openCursor();
                storeCursor.onerror = event => reject(event); 
                storeCursor.onsuccess = event => {
                    let cursor = event.target.result;    
                    let completionResult = func(cursor, store);
                    if (completionResult !== undefined)
                        resolve(completionResult);
                };

            };

        });

    }

}

class database {

    constructor() {
        
        this.datasets = {};

        let funcsToAttach = [
            'filter', 'map', 
            'group', 'ungroup', 
            'distinct', 'reduce', 
            'sort', 'print', 'merge', 'with'
        ];

        for(let funcName of funcsToAttach) 
            this[funcName] = (...args) => 
                this._callOnDs(funcName, ...args); 

    }

    addDataset (key, data) { 
        if (!data)
            throw `Cannot pass ${key} as undefined in 'addDataset'`
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
        if (isString(arg))
            return this.datasets[arg];
        if (isFunction(arg)) {
            let param = parser.parameters(arg)[0];
            return this.datasets(param)[0];
        }
    }

    getDatasets(arg) {

        let datasets = [];
        
        if (isString(arg))
            datasets.push(this.getDataset(arg));

        else for (let param of parser.parameters(arg)) 
            datasets.push(this.datasets[param]);
        
        return datasets.filter(ds => ds !== undefined);

    }

    // .map(), except return the dataset instead
    // of the calling FluentDB.
    get(funcOrKey) {
        if (isString(funcOrKey))
            return this.datasets[funcOrKey];
        let key = parser.parameters(funcOrKey)[0];
        return this
            ._callOnDs('map', funcOrKey)
            .datasets[key]
            .data;
    }

    // - Execute a function on a dataset, basically a proxy,
    //   but you don't know what the target is.
    // - Parse ...args -- which can be broken down into 
    //   targetDsName, lambda, ...otherArgs -- to identify
    //   targetDsName, ...dataArgs, lambda, ...otherArgs.
    // - If targetDsName is not present, it is implied by
    //   lambda.   
    _callOnDs(funcName, ...args) {

        // User parameters should take the form of 
        // 'targetDsName, lambda, ...args'.  But the user
        // might omit 'targetDsName'.  If so, create one 
        // now using the first parameter of 'lambda'.
        if (isFunction(args[0])) {
            let dsName = parser.parameters(args[0])[0];
            args.unshift(dsName);
        }

        // The dataset name to load the result into.  
        // The lambda to execute on a method of the dataset
        // args is now the other args to execute on that method.
        let targetDsName = args.shift(); 
        let lambda = args.shift();

        // Get the datasets referenced by 'lambda'.  The 
        // first one you'll need the full dataset object,
        // methods and all.  Subsequent ones you just want
        // their data, to later pass to the first one.
        let dataArgs = this.getDatasets(lambda);
        let targetDs = dataArgs.shift(); 
        dataArgs = dataArgs.map(ds => ds.data); 

        // Execute the method on the target dataset 
        this.datasets[targetDsName] = targetDs[funcName](
            ...dataArgs, 
            lambda, 
            ...args
        ); 

        return this;  

    }    

}

function _(obj) { 
    return Array.isArray(obj)
        ? new dataset(obj)
        : new database().addDatasets(obj); 
}

_.mergeMethod = mergeMethod;

_.reducer = reducer;
_.runEmulators = runEmulators;

_.reducer(_, 'first', v => v, array => array.reduce((a,b) => a || b));
_.reducer(_, 'last', v => v, array => array.reduce((a,b) => b || a));
_.reducer(_, 'sum', v => v, array => array.reduce((a,b) => a + b));
_.reducer(_, 'count', v => v, array => array.reduce((a,b) => a + 1, 0));

_.reducer(_, 'avg', v => v, array => {

    let agg = runEmulators(array, val => ({
        sum: _.sum(val), 
        count: _.count(val)     
    }));

    return agg.sum / agg.count

});

_.reducer(_, 'mad', v => v, array => {

    let agg = runEmulators(array, val => _.avg(val));

    for (let ix in array)
        array[ix] = Math.abs(array[ix] - agg);

    return runEmulators(array, val => _.avg(val));
    
});

_.reducer(_, 'cor', (x,y) => ({ x, y }), data => {

    let agg = runEmulators(data, row => ({ 
        xAvg: _.avg(row.x), 
        yAvg: _.avg(row.y) 
    }));

    for(let ix in data) 
        data[ix] = { 
            xDiff: data[ix].x - agg.xAvg, 
            yDiff: data[ix].y - agg.yAvg
        };

    agg = runEmulators(data, row => ({
        xyDiff: _.sum(row.xDiff * row.yDiff), 
        xDiffSq: _.sum(row.xDiff ** 2),
        yDiffSq: _.sum(row.yDiff ** 2)    
    }));

    return agg.xyDiff / (agg.xDiffSq ** 0.5 * agg.yDiffSq ** 0.5);
    
});

_.round = (term, digits) => Math.round(term * 10 ** digits) / 10 ** digits;

_.connector = connector;
_.idb = (storeName, dbName) => new connectorIdb(storeName, dbName);

export default _;
