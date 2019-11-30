/**
 * ISC License (ISC)
 * Copyright (c) 2019, Paul Wilcox <t78t78@gmail.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

let isPromise = obj => 
    Promise.resolve(obj) == obj;

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

class deferable {

    constructor(initial) {
        this.value = initial;
        this.thens = [];
        this.status = 'pending';
    }

    then(func) {
        this.thens.push(func);
        return this;
    }

    catch(func) {
        this.catchFunc = func;
        return this;
    }

    execute() {

        try {
                
            for(let func of this.thens) 
                this.value = isPromise(this.value) 
                    ? this.value.then(func)
                    : func(this.value);

            this.status = isPromise(this.value) 
                ? 'promisified' 
                : 'resolved'; 
            
            if (isPromise(this.value) && this.catchFunc)
                this.value = this.value.catch(this.catchFunc);

            return this.value;

        }

        catch(error) {
            this.status = 'rejected';
            if (this.catchFunc) {
                this.value = this.catchFunc(error);
                return;
            }
            throw error;
        }

    }

}

class database {

    constructor() {
        this.datasets = {};
    }

    addDataset (key, data) { 
        this.datasets[key] = data;
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

        if (isString(arg))
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
        if (isFunction(args[0])) {
            let param = parser.parameters(args[0])[0];
            args.unshift(param);
        }

        let reciever = args.shift(); // the dataset name to load the results into
        let func = args.shift(); // the first function passed by the user
        let funcDatasets = this.getDatasets(func); // the datasets referenced by that first function
        let sourceDataset = funcDatasets.shift(); // the first of these which is where we'll call the functions
        funcDatasets = funcDatasets.map(ds => ds.data); // for the remaining datasets, just get the data
        args.unshift(...funcDatasets); // pass any remaining datasets to the front of the arguments
console.log({sourceDataset});
        let results = sourceDataset[funcName](...args); // execute the function
        this.datasets[reciever] = results; // load the results into the reciever dataset
        return this;  // fluently exit 

    }

}

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

class connectorIdb extends connector {

    constructor (storeName, dbName) {
        super();
        this.dbName = dbName;
        this.storeName = storeName;
    }

    import(mapFunc, filterFunc) {

        return new Promise((resolve, reject) => {

            let dbCon = window.indexedDB.open(this.dbName);
            
            dbCon.onsuccess = () => {

                filterFunc = filterFunc || (x => true);
                let db = dbCon.result;
                let tx = db.transaction(this.storeName);
                let store = tx.objectStore(this.storeName);
                let storeCursor = store.openCursor();
                let results = [];
                
                storeCursor.onsuccess = event => {

                    let cursor = event.target.result;

                    if (!cursor) {
                        resolve(results);
                        return;
                    }

                    if (filterFunc(cursor.value))
                        results.push(
                            mapFunc(cursor.value)
                        );

                    cursor.continue();

                }; 
                
                storeCursor.onerror = event => reject(event);
                tx.oncomplete = () => db.close(); 
                tx.onerror = event => reject(event); 

            };

            dbCon.onerror = event => reject(event); 

        });

    }

    merge (incoming, matchingLogic, mapper, onDuplicate) {

        console.log({
            incoming,
            matchingLogic: matchingLogic.toString().substring(0,25),
            mapper: mapper.toString().substring(0,25),
            onDuplicate
        });
        throw 'not implemented';

        /*

        let typeIx = ix => (Array.isArray(type) && type[ix]);
        let typeIn = (...args) => [...args].includes(type.toLowerCase());
        
        let updateIfMatched = typeIn('upsert', 'update', 'full') || typeIx(0);
        let deleteIfMatched = typeIn('delete') || typeIx(1);
        let insertIfNoTarget = typeIn('upsert', 'insert', 'full') || typeIx(2);
        let deleteIfNoSource = typeIn('full') || typeIx(3);

        return new Promise((resolve, reject) => {

            let incomingBuckets = 
                new hashBuckets(sourceIdentityKey)
                .addItems(source);
    
            let dbCon = this.dbConnector.open();

            dbCon.onsuccess = () => {

                let db = dbCon.result;

                let tx = db.transaction(this.storeName, "readwrite");
                let store = tx.objectStore(this.storeName);

                let storeCursor = store.openCursor();
                
                storeCursor.onsuccess = event => {

                    let cursor = event.target.result;

                    if (!cursor) {
                        
                        if (insertIfNoTarget) {
                                
                            let remainingItems = // source but no target
                                incomingBuckets.getBuckets()
                                .map(bucket => bucket[0]);
    
                            for(let item of remainingItems) {
                                let addRequest = store.add(item);
                                addRequest.onerror = event => reject(event); 
                            }
                        
                        }

                        return;

                    }

                    let sourceRow = 
                        incomingBuckets.getBucketFirstItem(
                            cursor.value, 
                            targetIdentityKey,
                            true 
                        );

                    if (sourceRow)
                        if (deleteIfMatched) 
                            cursor.delete();
                        else if (updateIfMatched) 
                            cursor.update(sourceRow);
        
                    else if (deleteIfNoSource) 
                        cursor.delete();

                    cursor.continue();

                } 
                    
                storeCursor.onerror = event => reject(event); 
                tx.oncomplete = () => db.close();
                tx.onerror = event => reject(event); 

            };

            dbCon.onerror = event => reject(event); 

        });
        */
    }    

}

function $$(obj) { 
    return new FluentDB().addDatasets(obj); 
}

class FluentDB extends deferable {

    constructor() {

        super(new database());

        let funcsToAttach = [
            'filter', 'map', 
            'group', 'sort', 'reduce', 
            'print', 'merge', 'import'
        ];

        for(let funcName of funcsToAttach)
            this.attachFunc(funcName);

    }

    // TODO: Close all connector connections
    execute (finalMapper) {
        
        try {        

            let db = super.execute();

            if (finalMapper == undefined)
                return this;

            let param = parser.parameters(finalMapper)[0];
            finalMapper = noUndefinedForFunc(finalMapper);

            if (this.status == 'rejected' || finalMapper === undefined)
                return db;
    
            return this.callOnDb(db, 
                db => db.getDataset(param).data.map(finalMapper),
            );

        }

        catch(err) {
            return this.catcher(err);
        }

    }

    addDatasets(obj) {
        return this.then(
            db => this.callOnDb(db, db => db.addDatasets(obj))
        );
    }

    attachFunc (funcName) {

        this[funcName] = (...args) => 
            this.then(
                db => this.callOnDb(db, 
                    db => db.callOnDs(funcName, ...args)
                )
            );
            
    } 

    callOnDb(db, func) {

        db = this.promisifyDbIfNecessary(db);

        return isPromise(db) && this.catcher ? db.then(func).catch(this.catcher)
            : isPromise(db) ? db.then(func)
            : func(db);
    
    }

    promisifyDbIfNecessary (db) {
        
        if (isPromise(db))
            return db;
            
        let hasPromises = Object.values(db.datasets).filter(ds => isPromise(ds.data)).length > 0; 

        if (!hasPromises)
            return db;

        return Promise.all(db.datasets.map(ds => ds.data))
            .then(datas => {
                for(let i in db.datasets) 
                    db.datasets[i].data = datas[i];
                return db;
            });

    }

    catcher (err) { 
        if (this.catchFunc)
            return this.catchFunc(err);
        throw err;
    }    

}

$$.reducer = reducer;
$$.runEmulators = runEmulators;

$$.reducer($$, 'first', v => v, array => array.reduce((a,b) => a || b));
$$.reducer($$, 'last', v => v, array => array.reduce((a,b) => b || a));
$$.reducer($$, 'sum', v => v, array => array.reduce((a,b) => a + b));
$$.reducer($$, 'count', v => v, array => array.reduce((a,b) => a + 1, 0));

$$.reducer($$, 'avg', v => v, array => {

    let agg = runEmulators(array, val => ({
        sum: $$.sum(val), 
        count: $$.count(val)     
    }));

    return agg.sum / agg.count

});

$$.reducer($$, 'mad', v => v, array => {

    let agg = runEmulators(array, val => $$.avg(val));

    for (let ix in array)
        array[ix] = Math.abs(array[ix] - agg);

    return runEmulators(array, val => $$.avg(val));
    
});

$$.reducer($$, 'cor', (x,y) => ({ x, y }), data => {

    let agg = runEmulators(data, row => ({ 
        xAvg: $$.avg(row.x), 
        yAvg: $$.avg(row.y) 
    }));

    for(let ix in data) 
        data[ix] = { 
            xDiff: data[ix].x - agg.xAvg, 
            yDiff: data[ix].y - agg.yAvg
        };

    agg = runEmulators(data, row => ({
        xyDiff: $$.sum(row.xDiff * row.yDiff), 
        xDiffSq: $$.sum(row.xDiff ** 2),
        yDiffSq: $$.sum(row.yDiff ** 2)    
    }));

    return agg.xyDiff / (agg.xDiffSq ** 0.5 * agg.yDiffSq ** 0.5);
    
});

$$.round = (term, digits) => Math.round(term * 10 ** digits) / 10 ** digits;

$$.connector = connector;
$$.idb = (storeName, dbName) => new connectorIdb(storeName, dbName);

export default $$;
