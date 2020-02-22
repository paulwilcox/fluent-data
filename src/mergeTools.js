import parser from './parser.js';
import hashBuckets from './hashBuckets.js';
import * as g from './general.js';


export function* merge (
    leftData, 
    rightData, 
    matchingLogic, 
    mapFunc, 
    distinct
) {

    let mapper = normalizeMapper(mapFunc, matchingLogic);

    let keyFuncs = parser.pairEqualitiesToObjectSelectors(matchingLogic);
    let leftKeyFunc = keyFuncs.leftFunc;
    let rightKeyFunc = keyFuncs.rightFunc;    

    let leftBuckets = 
        new hashBuckets(leftKeyFunc, distinct)
        .addItems(leftData);

    let rightBuckets = 
        new hashBuckets(rightKeyFunc, distinct)
        .addItems(rightData);

    // yield matches and left unmatched
    for(let key of leftBuckets.keys()) {

        let leftBucket = leftBuckets.get(key);
        let rightBucket = rightBuckets.get(key) || [undefined];

        leftBuckets.delete(key);
        rightBuckets.delete(key);

        for(let leftItem of leftBucket)
        for(let rightItem of rightBucket) {
            let mapped = mapper(leftItem, rightItem);
            if (mapped)
                yield mapped;
        }

    }

    // yield right unmatched
    for(let key of rightBuckets.keys()) {
        let rightBucket = rightBuckets.get(key);
        rightBuckets.delete(key);
        for(let rightItem of rightBucket) {
            let mapped = mapper(undefined, rightItem);
            if (mapped)
                yield mapped;
        }
    }

}

export function normalizeMapper (mapFunc, matchingLogic) {

    if (!mapFunc)
        mapFunc = 'both null'; // inner join by default

    if (g.isString(mapFunc)) {

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
            case 'both': return g.noUndefined(Object.assign({}, right, left));
            case 'thob': return g.noUndefined(Object.assign({}, left, right));
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
