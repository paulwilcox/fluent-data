import hashBuckets from './hashBuckets.js';
import parser from './parser.js';

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
    leftHasher,
    rightHasher,
    leftSingular,
    rightSingular,
    algo
) {

    if (!leftHasher || !rightHasher) {
        let hashers = parser.pairEqualitiesToObjectSelectors(matcher);
        if (!hashers && method != 'loop') 
            throw   `Must loop merge, "${matcher}" could not be parsed` + 
                    `into functions that return objects for hashing.`;
        leftHasher = leftHasher || hashers.leftFunc;
        rightHasher = rightHasher || hashers.rightFunc;
    }

    if (algo == 'loop' && (leftSingular || rightSingular || leftHasher || rightHasher || !matcher ))
        throw `Loop merge must have a matcher parameter set, adn cannot have singular or hasher parameters set.`

    if (algo == 'loop') 
        yield* loopMerge (
            leftData, 
            rightData, 
            matcher, 
            mapper
        );
    else if (algo == 'hash')
        yield* hashMerge (
            leftData, 
            rightData, 
            matcher, 
            mapper, 
            leftHasher, 
            rightHasher, 
            leftSingular, 
            rightSingular
        )
    else throw `
        Algorithm '${algo}' is not recognized.  
        Leave undefined or use 'hash' or 'loop'.
    `;

}

function* hashMerge (
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
    else 
        yield mapped;
}

