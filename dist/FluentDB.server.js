/**
 * ISC License (ISC)
 * Copyright (c) 2019, Paul Wilcox <t78t78@gmail.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

'use strict';

var mongodb = require('mongodb');

class connector {

    import() { throw "Please override 'import'." }
    merge() { throw "Please override 'merge'." }

}

class connectorMongo extends connector {

    constructor (collectionName, url) {
        super();
        this.collectionName = collectionName;
        this.client = mongodb.MongoClient.connect(url, {useNewUrlParser: true});
    }

    import(mapFunc, filterFunc) {
            
        return this.client
            .then(async client => {
                
                filterFunc = this.filterFunc || (x => true);
                let db = client.db();
                let results = [];

                await db.collection(this.collectionName)
                    .find()
                    .forEach(record => {
                        if (filterFunc(record))
                            results.push(mapFunc(record));
                    });
                
                return results;

            });

    }

}

let isSubsetOf = (sub, sup) =>  
    setEquals (
        new Set(
            [...sub]
            .filter(x => [...sup].indexOf(x) >= 0) // intersection
        ), 
        sub
    );

let asSet = obj => {

    let s = 
        obj instanceof Set ? obj
        : isString(obj) ? new Set(obj)
        : Array.isArray(obj) ? new Set(obj)
        : undefined;

    if (!s) 
        throw "Could not convert object to set";
    
    return s;

};

// Max Leizerovich: stackoverflow.com/questions/31128855
let setEquals = (a, b) =>
    a.size === b.size 
    && [...a].every(value => b.has(value));

let isPromise = obj => 
    Promise.resolve(obj) == obj;

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

// array.flat not out in all browsers/node
let flattenArray = array => {
    let result = [];
    for(let element of array) 
        if (Array.isArray(element))
            for(let nestedElement of element)
                result.push(nestedElement);
        else 
            result.push(element);
    return result;
};

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

// Convert an unpromised object with promises as
// values to a promised object with regular values
let PromiseAllObjectEntries = obj => 
    Promise.all(
        Object.entries(obj)
        .map(entry => Promise.all(entry))
    )
    .then(entries => Object.fromEntries(entries));

var g = /*#__PURE__*/Object.freeze({
    isSubsetOf: isSubsetOf,
    asSet: asSet,
    setEquals: setEquals,
    isPromise: isPromise,
    stringifyObject: stringifyObject,
    isString: isString,
    isFunction: isFunction,
    flattenArray: flattenArray,
    noUndefinedForFunc: noUndefinedForFunc,
    noUndefined: noUndefined,
    PromiseAllObjectEntries: PromiseAllObjectEntries
});

class parser$1 {

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

parser$1.parse = function (func) {
    return new parser$1(func);
};

parser$1.parameters = function(func) {
    return new parser$1(func).parameters;
};

// Converts (v,w) => v.a = w.a && v.b == w.b 
// into v => { x0 = v.a, x1 = v.b }
// and w => { x0 = w.a, x1 = w.b }
parser$1.pairEqualitiesToObjectSelectors = function(func) {

    let parsed = new parser$1(func);
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
        this.promisifyCondition; // whether this.value is should become a promise
        this.promisifyConversion; // how to convert this.value into a promise
    }

    then(func) {
        this.thens.push(func);
        return this;
    }

    // for the user to set the catch logic
    catch(func) {
        this.catchFunc = func;
        return this;
    }

    // for the developer to use the catch logic
    catcher (error) { 
        this.status = 'rejected';
        if (!this.catchFunc)
            throw error;
        this.value = this.catchFunc(error);        
    }    

    execute(finalFunc) {

        try {
                
            if (finalFunc != undefined)
                this.thens.push(finalFunc);

            for(let func of this.thens) {
                
                this.promisifyIfNecessary();

                // process func on the value (different depending on whether 
                // it's a promise or not, and whether there's a catch func or not).
                this.value = 
                    isPromise(this.value) && this.catchFunc ? this.value.then(func).catch(this.catchFunc)
                    : isPromise(this.value) ? this.value.then(func)
                    : func(this.value);
   
            }

            this.status = isPromise(this.value) 
                ? 'promisified' 
                : 'resolved'; 
            
            this.promisifyIfNecessary();

            return this.value;

        }

        catch(error) {
            this.catcher(error);
        }

    }

    promisifyIfNecessary() {

        if (!isPromise(this.value) && this.promisifyCondition(this.value))
            this.value = this.promisifyConversion(this.value);

        else if (isPromise(this.value)) 
            this.value = this.value.then(db => 
                this.promisifyCondition(db)
                    ? this.promisifyConversion(db)
                    : db
            );

    }

}

class hashBuckets extends Map {
    
    constructor (
        hashKeySelector,
        stringify = true,
        distinct = false
    ) {
        super();
        this.distinct = distinct;
        this.hashKeySelector = stringify 
            ? item => stringifyObject(hashKeySelector(item)) 
            : hashKeySelector;
    }
 
    addItems(items) {
        for(let item of items) 
            this.addItem(item);
        return this;
    }

    addItem(item) {

        let key = this.hashKeySelector(item);
        
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
        hashKeySelector,
        stringify
    ) {
        let key = stringify
            ? stringifyObject(hashKeySelector(objectToHash))
            : hashKeySelector(objectToHash);
        return this.get(key);
    }

    getBuckets() {
        return Array.from(this.values());
    }

    * crossMap(incomingRows, mapper) {
        for (let incomingRow of incomingRows)
            for(let outputRow of crossMapRow(incomingRow, mapper)) {
                yield outputRow;
                if (this.distinct)
                    continue;
            }
    }

    * crossMapRow(incomingRow, hashKeySelector, stringify, mapper) {
                
        let existingRows = this.getBucket(incomingRow, hashKeySelector, stringify);

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

// 'buckle' signifies tuple with buckets as items.  Usage will 
// probably only be pairs though, so in the future if desired 
// you can simplify to simply allow pairs, not more than that.
class buckles extends Map {
    
    constructor (stringify = true) {
        super();
        this.stringify = stringify;
        this.bucketIndicies = new Set();
    }

    add(bucketIndex, hashFunc, distinctBehavior, ...items) {

        this.bucketIndicies.add(bucketIndex);

        for (let item of items) {
             
            let key = this.hashify(hashFunc, item);

            if (!this.has(key)) {
                let buckle = [];
                buckle[bucketIndex] = [item];
                this.set(key, buckle);
                continue;
            }

            if (!this.get(key)[bucketIndex])
                this.get(key)[bucketIndex] = [];

            switch(distinctBehavior) {
                case 'first': break;
                case 'last': this.get(key)[bucketIndex][0] = item; break;
                case 'dist': throw 'distinct option passed but more than one records match.'
                default: this.get(key)[bucketIndex].push(item);
            }

        }

        return this;

    }

    * crossMap(func) {

        for (let bucketSet of this.values())  
        for (let item of this.crossMapBuckle(bucketSet, func))
            yield item;
    }

    * crossMapBuckle(bucketSet, func) {

        let isFirstBucket = true;
        let crosses = [[]]; // but when overwriting, just do [].
        let working = [];
                  
        for (let bucketIX of [...this.bucketIndicies]) {

            let bucket = bucketSet[bucketIX] || [undefined];

            for (let cross of crosses) 
            for (let row of bucket) 
                isFirstBucket 
                    ? working.push([row]) // at this point cross is just a dummy '[]'
                    : working.push([...cross, row]);

            crosses = working;
            working = [];
            isFirstBucket = false;

        }

        for (let cross of crosses) {
            let mapped = func(...cross);
            if (mapped === undefined)
                continue;
            if (!Array.isArray(mapped)) {
                yield mapped;
                continue;
            }
            for(let entry of mapped)
                if (entry !== undefined)
                    yield entry;
        }

    }

    hashify (hashFunc, obj) {
        return this.stringify 
            ? stringifyObject(hashFunc(obj))
            : hashFunc(obj);
    }

}

function merger (leftData, rightData, matchingLogic, mapFunc, onDuplicate) {

    let { leftFunc, rightFunc } = parseMatchingLogic(matchingLogic);

    if (onDuplicate == 'distinct')
        onDuplicate = 'dist';

    if (onDuplicate !== undefined && !['first', 'last', 'dist'].includes(onDuplicate))
        throw 'onDuplicate must be one of: first, last, distinct, dist, or it must be undefined.';

    mapFunc = normalizeMapper(mapFunc, matchingLogic);

    return [...new buckles(leftFunc)
        .add(0, leftFunc, onDuplicate, ...leftData)
        .add(1, rightFunc, onDuplicate, ...rightData)
        .crossMap(mapFunc)
    ];

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

function parseMatchingLogic (matchingLogic) {

    let parsed = parser$1.pairEqualitiesToObjectSelectors(matchingLogic);

    if (!parsed)
        throw   'Could not parse function into object selectors.  ' +
                'Pass object selectors explicitly or use loop join instead';

    return {
        leftFunc: parsed.leftFunc,
        rightFunc: parsed.rightFunc || parsed.leftFunc
    }; 

}

function parametersAreEqual (a,b) {

    a = parser$1.parameters(a);
    b = parser$1.parameters(b);

    if (a.length != b.length)
        return false;

    for(let i in a)
        if (a[i] != b[i])
            return false;

    return true;

}

/*
    jsFiddle paging:

    anushree
   - https://stackoverflow.com/questions/19605078/
        how-to-use-pagination-on-html-tables
   - https://jsfiddle.net/u9d1ewsh
*/

function addPagerToTables(
    tables, 
    rowsPerPage = 10, 
    aTagMax = 10,
    pageInputThreshold = null
) {

    tables = 
        typeof tables == "string"
        ? document.querySelectorAll(tables)
        : tables;

    for (let table of Array.from(tables)) 
        addPagerToTable(table, rowsPerPage, aTagMax, pageInputThreshold);
    
}

function addPagerToTable(
    table, 
    rowsPerPage = 10, 
    aTagMax = 10,
    pageInputThreshold = null
) {

    let tBodyRows = table.querySelectorAll(':scope > tBody > tr');
    let numPages = Math.ceil(tBodyRows.length/rowsPerPage);
    
    if (pageInputThreshold == null) 
        pageInputThreshold = aTagMax;

    if(numPages == 1)
        return;

    let colCount = 
        Array.from(
            table.querySelector('tr').cells
        )
        .reduce((a,b) => a + parseInt(b.colSpan), 0);

    table
    .createTFoot()
    .insertRow()
    .innerHTML = `
        <td colspan=${colCount}>
            <div class="oneQueryPageDiv"></div>
        </td>
    `;

    let pageDiv = table.querySelector('.oneQueryPageDiv');
    insertPageLinks(pageDiv, numPages);
    insertPageInput(pageDiv, numPages, pageInputThreshold);
    addPageInputListeners(table);

    changeToPage(table, 1, rowsPerPage, numPages, aTagMax);

    for (let pageA of table.querySelectorAll('.oneQueryPageDiv a'))
        pageA.addEventListener(
            'click', 
            e => {

                let cPage = currentPage(table);
                let hasLt = e.target.innerHTML.substring(0,3) == '&lt';
                let hasGt = e.target.innerHTML.substring(0,3) == '&gt';
                let rel = e.target.rel;

                let toPage = 
                    (hasLt && cPage == 1) ? numPages
                    : (hasGt && cPage == numPages) ? 1
                    : (hasLt && rel < 0) ? cPage - 1
                    : (hasGt && rel < 0) ? cPage + 1
                    : parseInt(rel) + 1;

                changeToPage(
                    table, 
                    toPage,  
                    rowsPerPage,
                    numPages,
                    aTagMax
                );

            }
        );

}

function insertPageLinks(pageDiv, numPages, aTagMax) {

    let insertA = (rel,innerHtml) =>
        pageDiv
        .insertAdjacentHTML(
            'beforeend',
            `<a href='#' rel="${rel}">${innerHtml}</a> ` 
        );

    insertA(0,'<');
    insertA(-1,'<');

    for(let page = 1; page <= numPages; page++) 
        insertA(page - 1,page);

    insertA(-1,'>');
    insertA(numPages - 1,'>');

}

function insertPageInput(pageDiv, numPages, pageInputThreshold) {

    if (numPages < pageInputThreshold)
        return;

    pageDiv
    .insertAdjacentHTML(
        'beforeend',
        `
            <br/>
            <div class='oneQueryPageInputDiv' style='display:none;'>
                <div contenteditable='true' class='oneQueryPageInput'>1</div>
                <button class='oneQueryPageInputSubmit'></button>
            </div>
            <label class='oneQueryPageRatio'>${numPages} pages</label>
        `
    );

}

function showInputDiv (tbl, show) {
    if (!tbl.tFoot.querySelector('.oneQueryPageInputDiv'))
        return;
    tbl.tFoot.querySelector('.oneQueryPageInputDiv').style.display = show ? 'inline-block' : 'none';
    tbl.tFoot.querySelector('.oneQueryPageRatio').style.display = show ? 'none' : 'inline-block';
}

function addPageInputListeners (table) {

    if (!table.tFoot.querySelector('.oneQueryPageInputDiv'))
        return;

    let listen = (selector, event, callback) => 
        table.querySelector(selector)
        .addEventListener(event, callback); 

    table
    .addEventListener(
        'mouseleave',
        e => {
            showInputDiv(e.target, false);
            table.querySelector('.oneQueryPageInput').innerHTML = "";
        }
    );

    listen(
        '.oneQueryPageRatio',
        'mouseenter',
        e => showInputDiv(table, true)
    );

    listen(
        '.oneQueryPageRatio', 
        'click',
        e => showInputDiv(table, true)
    );

    listen(
        '.oneQueryPageInput',
        'mouseenter',
        e => table.querySelector('.oneQueryPageInput').innerHTML = ""
    );

    listen(
        '.oneQueryPageInputSubmit',
        'click',
        e => {

            let pInput = table.querySelector('.oneQueryPageInput');
            let desiredPage = parseInt(pInput.innerHTML);

            if (isNaN(desiredPage)) {
                pInput.innerHTML = "";
                return;
            }

            changeToPage(
                table,
                desiredPage,
                rowsPerPage,
                numPages,
                pageButtonDeviation
            );

        }

    );    

}

function changeToPage(
    table, 
    page, 
    rowsPerPage, 
    numPages, 
    aTagMax
) {

    let startItem = (page - 1) * rowsPerPage;
    let endItem = startItem + rowsPerPage;
    let pageAs = table.querySelectorAll('.oneQueryPageDiv a');
    let tBodyRows = [...table.tBodies].reduce((a,b) => a.concat(b)).rows;

    for (let pix = 0; pix < pageAs.length; pix++) {

        let a = pageAs[pix];
        let aText = pageAs[pix].innerHTML;
        let aPage = parseInt(aText);

        if (page == aPage)
            a.classList.add('active');
        else 
            a.classList.remove('active');

        a.style.display =
            (
                    aPage > page - Math.ceil(aTagMax / 2.0) 
                && aPage < page + Math.ceil(aTagMax / 2.0)
            )
            || isNaN(aPage) 
            ? 'inline-block'
            : 'none';

        for (let trix = 0; trix < tBodyRows.length; trix++) 
            tBodyRows[trix].style.display = 
                (trix >= startItem && trix < endItem)
                ? 'table-row'
                : 'none';  

    }

}

function currentPage (table) {
    return parseInt(
        table.querySelector('.oneQueryPageDiv a.active').innerHTML
    );
}

// TODO: See about populating defaultCss variable below
// automatically from printer.css as an npm run task and
// as a prerequisite to rollup, with rollup probably being
// part of that npm run task.  

// Christoph at https://stackoverflow.com/questions/
//   524696/how-to-create-a-style-tag-with-javascript
function addDefaultCss () {

    if (hasoneQueryCssRule())
        return;

    let style = document.createElement('style');
    style.type = 'text/css';

    style.appendChild(document.createTextNode(defaultCss));
    document.head.appendChild(style);

}

let hasoneQueryCssRule = () => {

    for(let sheet of document.styleSheets)
    for(let rule of sheet.rules)
    if(rule.selectorText.substring(0,5) == ".oneQuery")
        return true;

    return false; 

};

let defaultCss = `

    .oneQueryString {
        color: #FF9900;
    }

    .oneQueryNumber {
        color: #0088cc;
    }

    .oneQueryNuloneQuery {
        color: gainsboro;
        font-style: italic;
    }

    .oneQueryFunc {
        color: BB5500;
        font-family: monospace;
    }

    .oneQueryTable {
        border: 2px solid #0088CC;
        border-collapse: collapse;
        margin:5px;
    }

    .oneQueryTable caption {
        border: 1px solid #0088CC;
        background-color: #0088CC;
        color: white;
        font-weight: bold;
        padding: 3px;
    }

    .oneQueryTable th {
        background-color: gainsboro;
        border: 1px solid #C8C8C8;
        padding: 3px;
    }

    .oneQueryTable td {
        border: 1px solid #C8C8C8;
        text-align: center;
        vertical-align: middle;
        padding: 3px;
    }

    .oneQueryTable tFoot {
        background-color: whitesmoke;
        font-style: italic;
        color: teal;
    }

    .oneQueryTable tFoot a {
        text-decoration: none;
        color: teal;
    }

    .oneQueryTable tFoot a.active {
        text-decoration: underline;
    }

    .oneQueryPageDiv {
        text-align: left;
        vertical-align: middle;
        font-size: smaller;
    }

    .oneQueryPageInputDiv * {
        display: inline-block;
    }

    .oneQueryPageInput {
        padding: 1px 3px;
        background-color: white;
        border: solid 1px blue;
        color: black;
        font-style: normal;
        min-width: 15px;
    }

    .oneQueryPageInputSubmit {
        height: 10px;
        width: 10px;
        margin: 0;
        padding: 0;
    }

`;

function print(target, obj, caption) {

    document.querySelector(target).innerHTML +=
        makeHtml(obj, caption);

    let maybeTables = 
        document.querySelector(target)
        .querySelectorAll('.oneQueryTable');

    if (maybeTables.length > 0)
        addPagerToTables(maybeTables);

    addDefaultCss();

}

function makeHtml(obj, caption) {

    let printType = getPrintType(obj);

    return printType == 'arrayOfObjects' ? arrayOfObjectsToTable(obj, caption)
        : printType == 'array' ? arrayToTable(obj, caption)
        : printType == 'string' ? stringToHtml(obj)
        : printType == 'number' ? `<span class='oneQueryNumber'>${obj}</span>`
        : printType == 'nuloneQuery' ? `<span class='oneQueryNuloneQuery'>${obj}</span>`
        : printType == 'function' ? functionToHtml(obj)
        : printType == 'object' ? objectToTable(obj)
        : `${obj}`;

}

function getPrintType (obj) {

    let isArray = Array.isArray(obj);        
    let isArrayOfObjects = false;

    if (isArray) {
        let len = obj.length;
        let keyCounts = Object.values(getArrayKeys(obj));
        let highlyUsedKeys = keyCounts.filter(kc => kc >= len * 0.75).length;
        isArrayOfObjects = 
            highlyUsedKeys >= keyCounts.length * 0.75 // highly structured;
            && keyCounts.length > 0; 
    }

    return isArrayOfObjects ? 'arrayOfObjects'
        : isArray ? 'array'
        : (obj == null || typeof obj == 'undefined') ? 'nuloneQuery'
        : typeof obj;

}

function getArrayKeys (array) {

    let keys = {};

    for(let item of array) 
    if (getPrintType(item) == 'object')
    for(let key of Object.keys(item))
        if(keys[key])
            keys[key] += 1;
        else 
            keys[key] = 1;

    return keys;

}

function stringToHtml (str) {
    return `
        <span class='oneQueryString'>
            ${ htmlEncode(str) }
        </span>
    `;
}

function functionToHtml (func) {
    return `
        <span class='oneQueryFunc'>
            ${ htmlEncode(func.toString()) }
        </span>
    `;
}

function objectToTable (obj) {
    
    let html = ``;

    for (let entry of Object.entries(obj))
        html += `
        <tr>
            <th>${entry[0]}</th>
            <td>${makeHtml(entry[1])}</td>
        </tr>
        `;

    return `<table class='oneQueryTable'>${html}</table>`;

}

function arrayToTable (items, caption) {
    
    let html = ``;

    for(let item of items) 
        html += `<tr><td>${makeHtml(item)}</td></tr>`;

    return `
        <table class='oneQueryTable'>
            ${caption != null ? `<caption>${caption}</caption>` : ''}
            ${html}
        </table>`;

}

function arrayOfObjectsToTable (objects, caption) {

    let keys = Object.keys(getArrayKeys(objects));
    
    let header = `<tr>`;
    for(let key of keys)
        header += `<th>${key}</th>`;
    header += `</tr>`;

    let body = ``;

    for(let obj of objects) {
        body += `<tr>`;
        if (getPrintType(obj) == 'object')
            for (let key of keys) 
                body += `<td>${makeHtml(obj[key])}</td>`;
        else 
            body += `<td colspan=${keys.length}>${makeHtml(obj)}</td>`;
        body += `</tr>`;
    }

    return `
        <table class='oneQueryTable'>
            ${caption != null ? `<caption>${caption}</caption>` : ''}
            <tHead>${header}</tHead>
            <tBody>${body}</tBody>
        </table>
    `;

}

function htmlEncode (str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\t/g, '&emsp;')
        .replace(/  /g, '&emsp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');
}

class dataset {

    constructor(data) {
        this.data = data;
    }

    map (func) {    
        return recurse (
            data => data.map(noUndefinedForFunc(func)),
            this.data, 
        );
    }

    filter (func) {    
        return recurse (
            data => data.filter(func),
            this.data, 
        );
    }

    sort (func) {

        let params = parser.parameters(func);

        let outerFunc = 
            params.length > 1 
            ? data => data.sort(func)
            : data => quickSort(data, func);
        
        return recurse(outerFunc, this.data);

    } 

    group (func) {
        let b = new hashBuckets(func)
            .addItems(this.data)
            .getBuckets();
        return new dataset(b);
    }

    reduce (func) {
        let outerFunc = data => runEmulators(data, func);
        let ds = recurse(outerFunc, this.data);
        return ds;
    }    

    merge (incoming, matchingLogic, mapper, onDuplicate) {
        return new dataset(merger (
            this.data, 
            incoming, 
            matchingLogic, 
            mapper, 
            onDuplicate
        ));
    }

    print (func, caption, target) {

        let data = recurse (
            data => data.map(noUndefinedForFunc(func)),
            this.data, 
        ).data;

        if (target) 
            print(target, data, caption);
        else if(caption)
            console.log(caption, data); 
        else 
            console.log(data); 

        return this;
        
    }

}


function recurse (func, data) {

    let isNested = Array.isArray(data[0]);

    if (!isNested) 
        return new dataset(func(data));    

    let output = [];

    for (let nested of data)  
        output.push(func(nested));

    return new dataset(output);

}

class database {

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
        if (isString(arg))
            return this.datasets[arg];
        if (isFunction(arg)) {
            let param = parser$1.parameters(arg)[0];
            return this.datasets(param)[0];
        }
    }

    getDatasets(arg) {

        if (isString(arg))
            return [this.getDataset(arg)];

        // arg is then a function 
        let datasets = [];
        for(let param of parser$1.parameters(arg)) {
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
            let param = parser$1.parameters(args[0])[0];
            args.unshift(param);
        }

        let reciever = args.shift(); // the dataset name to load the results into
        let func = args.shift(); // the first function passed by the user
        let funcDatasets = this.getDatasets(func); // the datasets referenced by that first function
        let sourceDataset = funcDatasets.shift(); // the first of these which is where we'll call the functions
        args.unshift(func); // pass the evaluated 'func' back to the front of the arguments
        funcDatasets = funcDatasets.map(ds => ds.data); // for the remaining datasets, just get the data
        args.unshift(...funcDatasets); // pass any remaining datasets to the front of the arguments
        let results = sourceDataset[funcName](...args); // execute the function
        this.datasets[reciever] = results; // load the results into the reciever dataset
        return this;  // fluently exit 

    }

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

    print(mapFunc, caption, target) {
            
        let results = [];

        return this.curse(cursor => {

            if (!cursor) {
                target ? print(target, results, caption)
                    : caption ? console.log(caption, results) 
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
        mapper, 
        distinct = false
    ) {

        let keyFuncs = parser$1.pairEqualitiesToObjectSelectors(matchingLogic);
        let targetKeyFunc = keyFuncs.leftFunc;
        let sourceKeyFunc = keyFuncs.rightFunc;    
        let rowsToAdd = []; 
        let processedTargets = new hashBuckets(targetKeyFunc, true, true);

        let incomingBuckets = 
            new hashBuckets(sourceKeyFunc, true, distinct)
            .addItems(incoming);

        return this.curse((cursor, store) => {

            // When you've finished looping the target, add 
            // any excess rows to the store.  Then resolve. 
            if (!cursor) {                           
                for(let row of rowsToAdd) {
                    let addRequest = store.add(row);
                    addRequest.onerror = event => reject(event); 
                }
                return this;
            }

            // If user wants distinct rows in the target, then
            // track if such a row has already been processed.
            // If so, delete future rows in the target.  If not,
            // just record that it has now been processed.
            if (distinct) {  
                let processedTarget = processedTargets.getBucket(cursor.value, targetKeyFunc, true);
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
                true,
                mapper
            );

            // For the first match, delete or update. based on
            // whether there's a match or not.
            let outputYield = outputGenerator.next();
            (outputYield.done) 
                ? cursor.delete()
                : cursor.update(outputYield.value);

            // For additional matches, add them to the rowsToAdd array.
            outputYield = outputGenerator.next();
            while (outputYield.done === false) {
                rowsToAdd.push(outputYield.value); // I (psw) don't know if store.add is safe here
                outputYield = outputGenerator.next();
            }

            cursor.continue();

        }, 'readwrite');
        
    }


    merge2 (
        incoming, 
        matchingLogic, 
        mapper, 
        distinct = false
    ) {

        let keyFuncs = parser$1.pairEqualitiesToObjectSelectors(matchingLogic);
        let targetKeyFunc = keyFuncs.leftFunc;
        let sourceKeyFunc = keyFuncs.rightFunc;    

        let incomingBuckets = 
            new hashBuckets(sourceKeyFunc, true, distinct)
            .addItems(incoming);

        let rowsToAdd = []; 

        return this.curse((cursor, store) => {

            // When you've finished looping the target, add 
            // any excess rows to the store.  Then resolve. 
            if (!cursor) {                           
                for(let row of rowsToAdd) {
                    let addRequest = store.add(row);
                    addRequest.onerror = event => reject(event); 
                }
                return this;
            }

            // Finds the bucket of incoming rows matching the 
            // target and 'crossMaps' them.  Returns a generator. 
            let outputGenerator = incomingBuckets.crossMapRow(
                cursor.value, 
                targetKeyFunc,
                true,
                mapper
            );

            // For the first match, delete or update. based on
            // whether there's a match or not.
            let outputYield = outputGenerator.next();
            outputYield.done 
                ? cursor.delete()
                : cursor.update(outputYield.value);

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
    
                let tx = db.transaction(this.storeName, transactionMode);
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

function $$(obj) { 
    return new FluentDB().addDatasets(obj); 
}

class FluentDB extends deferable {

    constructor() {

        super(new database());

        super.promisifyCondition = db => { 

            // The final mapper in 'execute' will cause the 
            // thenable to return a non-database
            if(!(db instanceof database))
                return false;

            return 0 < 
                Object.values(db.datasets)
                .filter(ds => isPromise(ds))
                .length;

        };

        super.promisifyConversion = db => {
            let datasets = PromiseAllObjectEntries(db.datasets);
            return Promise.all([db,datasets])
                .then(obj => {
                    let [db,datasets] = obj;
                    db.datasets = datasets;
                    return db;
                });
        };

        this.addDatasets = obj => this.then(db => db.addDatasets(obj));

        let funcsToAttach = [
            'filter', 'map', 
            'group', 'sort', 'reduce', 
            'print', 'merge', 'import'
        ];

        for(let funcName of funcsToAttach) 
            this[funcName] = 
                (...args) => this.then(db => db.callOnDs(funcName, ...args)); 

    }

    // TODO: Close all connector connections
    execute (finalMapper) {
        
        if (finalMapper) {
            this.map(finalMapper); // adds a mapping to this.thens
            let param = parser$1.parameters(finalMapper)[0];
            return super.execute(db => db.datasets[param].data); // just get the data
        }

        return super.execute();

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

$$.mongo = (collectionName, url) => new connectorMongo(collectionName, url);

module.exports = $$;
