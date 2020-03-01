import parser from './parser.js';
import hashBuckets from './hashBuckets.js';
import * as g from './general.js';

export function* merge (
    leftData, 
    rightData, 
    matcher, 
    mapper, 
    distinct
) {

    let leftHasher;
    let rightHasher;
    let _mapper;
    let algorithm;

    if (!g.isFunction(mapper) && !g.isString(mapper)) {
        leftHasher = mapper.leftHasher;
        rightHasher = mapper.rightHasher;
        _mapper = normalizeMapper(mapper.mapper, matcher);
        algorithm = mapper.algorithm;
    }
    else {
        let hashers = parser.pairEqualitiesToObjectSelectors(matcher);
        leftHasher = hashers.leftFunc;
        rightHasher = hashers.rightFunc;
        _mapper = normalizeMapper(mapper, matcher);
    }

    // If no hashers are passed, then do full-on loop join
    if (algorithm == 'loop') {
        yield* loopMerge(leftData, rightData, matcher, _mapper);
        return;
    }

    if (algorithm == 'hash' || !algorithm)
        yield* hashMerge(
            leftData, 
            rightData,
            matcher,
            leftHasher, 
            rightHasher,
            _mapper, 
            distinct 
        );

}

function* hashMerge (
    leftData, 
    rightData, 
    matcher,
    leftHasher,
    rightHasher,
    mapper,
    distinct
) {

    let leftBuckets = 
        new hashBuckets(leftHasher, distinct)
        .addItems(leftData);

    let rightBuckets = 
        new hashBuckets(rightHasher, distinct)
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
