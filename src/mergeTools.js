import hashBuckets from './hashBuckets.js';

export function* hashMerge (
    leftData, 
    rightData, 
    matcher,
    mapper,
    leftHasher,
    rightHasher,
    leftSingular,
    rightSingular
) {

    let leftBuckets = new hashBuckets(leftHasher, leftSingular).addItems(leftData);
    let rightBuckets = new hashBuckets(rightHasher, rightSingular).addItems(rightData);

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
        for(let rightItem of removeBucket(rightBuckets, key)) 
            yield* yieldMapped(mapper(undefined, rightItem));

}

export function* loopMerge (
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
            yield* yieldMapped(mapper(leftData[l], rightData[r]));
        }
    }

    for (let l in leftData) 
        if (!leftHits.has(l))
            yield* yieldMapped(mapper(leftData[l], undefined));

    for (let r in rightData) 
        if (!rightHits.has(r))
            yield* yieldMapped(mapper(undefined, rightData[r]));

}

function* yieldMapped (mapped) {
    if (!mapped)
        return;
    if (mapped[Symbol.iterator]) 
        yield* mapped;
    else if (mapped)
        yield mapped;
}

