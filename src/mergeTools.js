import parser from './parser.js';
import hashBuckets from './hashBuckets.js';
import * as g from './general.js';

export let mergeMethod = {
    hash: 'hash',
    loop: 'loop',
    hashDistinct: 'hashDistinct'
};

export function* merge (
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

    if (!g.isFunction(mapper) && !g.isString(mapper)) {
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
    }

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
