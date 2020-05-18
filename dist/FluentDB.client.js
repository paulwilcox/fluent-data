/**
 * ISC License (ISC)
 * Copyright (c) 2019, Paul Wilcox <t78t78@gmail.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

function reducer (
    
    // Function: The parameters determine the number 
    // of parameters expected to be passed in by the user.
    // The object returned by is used by 'processor'.
    inputShaper, 

    // Function: The logic used to aggregate values.
    processor

) {
    return (...vals) => 
        new emulator(
            processor, 
            inputShaper(...vals)
        );
}

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

// Thanks domino at https://stackoverflow.com/questions/18884249
let isIterable = (input, includeStrings = false) => 
    !includeStrings && isString(includeStrings) ? false
    : Symbol.iterator in Object(input);

let noUndefined = obj => {
    
    for(let key of Object.keys(obj))
        if (obj[key] === undefined) 
            delete obj[key];

    return obj;

};

// equality by values
let eq = (obj1, obj2) => {

    if (obj1 == undefined && obj2 != undefined) return false;
    if (obj1 != undefined && obj2 == undefined) return false;
    if (obj1 == undefined && obj2 == undefined) return true;

    if (isString(obj1) && isString(obj2))
        return obj1 == obj2;

    let obj1Keys = Object.keys(obj1);
    let obj2Keys = Object.keys(obj2);
    
    if (obj1Keys.length != obj2Keys.length)
        return false;

    if (obj1Keys.length == 0 && obj2Keys.length == 0)
        return obj1 == obj2;

    for(let key of obj1Keys) {
        
        if(!eq(obj1[key], obj2[key]))
            return false;
        
    }

    return true;

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

function* quickSort (
    unsorted, 
    func,
    funcReturnsArray
) {

    // Initializations

        let lesserThans = [];
        let greaterThans = [];
        let pivot;

    // Get the first of unsorted, establish it as the pivot
        
        if (!Array.isArray(unsorted)) {
            pivot = unsorted.next();
            if (pivot.done)
                return pivot.value;
            pivot = pivot.value; 
        } 
        else 
            pivot = unsorted.pop();

    // Compare remaining rows to the pivot and put into 
    // bins of lesser records and equal/greater records.
                
        let pivotSelection = funcReturnsArray ? func(pivot) : null;

        for (let row of unsorted) {

            let orderDecision = funcReturnsArray
                ? compareArrays(func(row), pivotSelection) // func returns array
                : func(row, pivot); // func returns boolean

            orderDecision == -1
                ? lesserThans.push(row) 
                : greaterThans.push(row);

        }

    // output in the incrementally better order 
        
        if (lesserThans.length > 0)
            yield* quickSort(lesserThans, func, funcReturnsArray);
        
        yield pivot;
        
        if (greaterThans.length > 0)
            yield* quickSort(greaterThans, func, funcReturnsArray);

}
// Capture lessThan (-1), greaterThan (1) or equal (0)
function compareArrays (
    leftVals,
    rightVals
) {

    // User has option to pass array as orderFunc to
    // created steped orderings.  If they don't pass
    // an array, just wrap in one at this step.
    if (!Array.isArray(leftVals))
        leftVals = [leftVals];
    if (!Array.isArray(rightVals))
        rightVals = [rightVals];
        
    let length = leftVals.length > rightVals.length
        ? leftVals.length
        : rightVals.length;

    for(let i = 0; i < length; i++) {
        if (leftVals[i] < rightVals[i]) return -1;
        if (leftVals[i] > rightVals[i]) return 1;
    }

    return 0;

}

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
            throw   `it seems that a non-lambda function 
                    was passed to 'parser'`;
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

            if (ep.startsWith(`${leftParam}.`) || ep == leftParam)
                leftEq = ep;
            else if (ep.startsWith(`${rightParam}.`) || ep == rightParam)
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

// Options can be a mapper function,
// it can be a keyword representing a mapper function,
// or it can be, as the term implies, an object 
// of paramters for passing options 
function* merge (
    leftData, 
    rightData, 
    matcher, 
    options, 
    method
) {

    let leftHasher;
    let rightHasher;
    let mapper;

    if (method && !Object.keys(mergeMethod).includes(method)) throw `
        method '${method}' is not recognized.  Leave undefined or
        use one of: ${Object.keys(mergeMethod).join(', ')}.
    `;

    // if options is an object with properties 
    if (!isFunction(options) && !isString(options)) {
        leftHasher = options.leftHasher || options.hasher;
        rightHasher = options.rightHasher || options.hasher;
        mapper = normalizeMapper(options.mapper, matcher);
    }
    // if options is a function or a string
    else {

        mapper = normalizeMapper(options, matcher);
        let hashers = parser.pairEqualitiesToObjectSelectors(matcher);

        if(!hashers) {
            method = method || 'loop';
            if (method != 'loop') throw ` 
                Must loop merge, "${matcher}" could not be parsed 
                into functions that return objects for hashing.`;
        }
        else {
            leftHasher = hashers.leftFunc;
            rightHasher = hashers.rightFunc;
        }

    }

    // If no hashers are passed, then do full-on loop join
    if (method == 'loop') {
        yield* loopMerge(leftData, rightData, matcher, mapper);
        return;
    }

    if (!method || ['hash', 'hashDistinct'].includes(method))
        yield* hashMerge(
            leftData, 
            rightData,
            matcher,
            leftHasher, 
            rightHasher,
            mapper, 
            method 
        );

}

function* hashMerge (
    leftData, 
    rightData, 
    matcher,
    leftHasher,
    rightHasher,
    mapper,
    method
) {

    let leftBuckets = 
        new hashBuckets(leftHasher, method == 'hashDistinct')
        .addItems(leftData);

    let rightBuckets = 
        new hashBuckets(rightHasher, method == 'hashDistinct')
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
        for(let rightItem of removeBucket(rightBuckets, key)) 
            yield* wrapper(mapper(undefined, rightItem));

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
        if (leftData[l] == undefined || rightData[r] == undefined)
            continue;
        if (matcher(leftData[l], rightData[r])) {
            leftHits.add(l);
            rightHits.add(r);
            yield* wrapper(mapper(leftData[l], rightData[r]));
        }
    }

    for (let l in leftData) 
        if (!leftHits.has(l))
            yield* wrapper(mapper(leftData[l], undefined));

    for (let r in rightData) 
        if (!rightHits.has(r))
            yield* wrapper(mapper(undefined, rightData[r]));

}

function* wrapper (mapped) {
    if (!mapped)
        return;
    if (mapped[Symbol.iterator]) 
        yield* mapped;
    else 
        yield mapped;
}

function normalizeMapper (mapFunc, matchingLogic) {

    if (!mapFunc)
        mapFunc = 'both null'; // inner join by default

    if (isString(mapFunc)) {
        
        if (mapFunc.length == 2) 
            mapFunc = inflateKeywords(mapFunc);

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

function inflateKeywords (keywordString) {
    let replacer = str => 
          str == 'b' ? 'both'
        : str == 't' ? 'thob' 
        : str == 'l' ? 'left'
        : str == 'r' ? 'right'
        : str == 'n' ? 'null'
        : str == 's' ? 'stack'
        : null;
    return replacer(keywordString.substring(0,1)) + ' ' +
        replacer(keywordString.substring(1,2)); 
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

    constructor(data, groupLevel = 1) {
        this.data = data;
        this.groupLevel = groupLevel;
    }

    *[Symbol.iterator]() { 
        yield* this.data;
    }

    map (func) {    
        let _map = function* (data) {
            for(let row of data)
                yield noUndefined(func(row));
        };
        this.data = recurse(_map, this.data, this.groupLevel);
        return this;
    }

    filter (func) {    
        let _filter = function* (data) {
            for(let row of data)
            if(func(row))
                yield row;
        };
        this.data = recurse(_filter, this.data, this.groupLevel);
        return this;
    }

    sort (func) {
        let outerFunc = parser.parameters(func).length > 1 
            ? data => quickSort(data, func, false)
            : data => quickSort(data, func, true);
        this.data = recurse(outerFunc, this.data, this.groupLevel);
        return this;
    } 

    group (func) {
        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets();
        this.data = recurse(outerFunc, this.data, this.groupLevel);
        this.groupLevel++;
        return this;
    }

    ungroup (func) {

        if (!func) 
            func = x => x;

        if (this.groupLevel == 1) {
            let counter = 0;
            for (let item of this.data) {
                if (++counter > 1)
                    throw   'Ungrouping to level 0 is possible, but ' +
                            'there can only be one item in the dataset.';
                this.data = item;
            }
            this.groupLevel--;
            return this;
        }

        let outerFunc = function* (data) {
            for (let item of data)
            for (let nested of item)
                yield func(nested);
        };

        // stop early becuase you want one level above base records
        this.data = recurse(outerFunc, this.data, this.groupLevel - 1);
        this.groupLevel--;
        return this;

    }

    reduce (func, ungroup = true) {
        // Wrap outerFunc result in array to restore the group level
        let outerFunc = data => [runEmulators(data, func)];
        this.data = recurse(outerFunc, this.data, this.groupLevel);
        if (ungroup)
            this.ungroup(x => x);
        return this;
    }    

    distinct (func, sorter) {

        func = func || (x => x);
        
        if (sorter) sorter = 
            parser.parameters(sorter).length > 1 
            ? data => quickSort(data, func, false)
            : data => quickSort(data, func, true);
        else 
            sorter = data => data;

        let outerFunc = data => 
            new hashBuckets(func)
            .addItems(data)
            .getBuckets()
            .map(bucket => {
                return [...sorter(bucket)][0]
            });

        this.data = recurse(outerFunc, this.data, this.groupLevel);
        return this;

    }

    // TODO: Test whether this consumes the external dataset
    // by iterating it.
    merge (incoming, matcher, options, method) {

        if (matcher == '=') 
            matcher = (l,r) => eq(l,r);

        let outerFunc = data => [...merge (
            data, 
            incoming instanceof dataset ? incoming.data : incoming, 
            matcher, 
            options, 
            method
        )];

        this.data = recurse(outerFunc, this.data, this.groupLevel); 
        return this;

    }

    with (func) {
        let arr = recurseToArray(x => x, this.data, this.groupLevel);
        func(arr);
        this.data = arr;
        return this;
    }

    get (func) {
        let arr = recurseToArray(
            func || function(x) { return x }, 
            this.data,
            this.groupLevel
        );
        this.data = arr;
        return arr;
    }

    toJsonString(func) {
        let dataJson = JSON.stringify(this.get(func));
        return `{"data":${dataJson},"groupLevel":${this.groupLevel}}`;
    }

}

function* recurse (func, data, levelCountdown) {

    if (levelCountdown === 0)
        return func([data])[0];

    if (levelCountdown > 1) { // data is nested groups
        for (let item of data) 
            yield recurse(func, item, levelCountdown - 1);
        return;
    }

    yield* func(data); // data is base records

}

function recurseToArray (func, data, levelCountdown) {

    if (levelCountdown === 0)
        return func([data])[0];

    let list = [];
    for(let item of data)
        list.push(
            levelCountdown > 1          
            ? recurseToArray(func, item, levelCountdown - 1)
            : noUndefined(func(item))
        );
    return list;    

}

function _(obj) { 
    if (!isIterable(obj))
        throw 'Object instantiating FluentDB must be iterable';
    return obj instanceof dataset ? obj : new dataset(obj);
}

_.fromJson = function(json) {

    let ds = new dataset();

    if (json.constructor.name == 'Response') 
        return json.json().then(parsed => {
            ds.data = parsed.data;
            ds.groupLevel = parsed.groupLevel;
            return ds;
        });

    let parsed = isString(json) ? JSON.parse(json) : json;
    ds.data = parsed.data;
    ds.groupLevel = parsed.groupLevel;

    return ds;

};

_.mergeMethod = mergeMethod;

_.reducer = reducer;
_.runEmulators = runEmulators;

_.first = reducer(v => v, array => array.reduce((a,b) => a || b));
_.last = reducer(v => v, array => array.reduce((a,b) => b || a));
_.sum = reducer(v => v, array => array.reduce((a,b) => a + b));
_.count = reducer(v => v, array => array.reduce((a,b) => a + 1, 0));

_.avg = reducer(v => v, array => {

    let agg = runEmulators(array, val => ({
        sum: _.sum(val), 
        count: _.count(val)     
    }));

    return agg.sum / agg.count

});

_.mad = reducer(v => v, array => {

    let agg = runEmulators(array, val => _.avg(val));

    for (let ix in array)
        array[ix] = Math.abs(array[ix] - agg);

    return runEmulators(array, val => _.avg(val));
    
});

_.cor = reducer((x,y) => ({ x, y }), data => {

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

export default _;
