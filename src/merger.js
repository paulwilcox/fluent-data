import { hashBuckets } from './hashBuckets.js';

export function merger (type, target, source, targetIdentityKey, sourceIdentityKey) {

    let typeIx = ix => Array.isArray(type) && type[ix];
    let typeIn = (...args) => !Array.isArray(type) && [...args].includes(type.toLowerCase());
    
    let updateIfMatched = typeIn('upsert', 'update', 'full') || typeIx(0);
    let deleteIfMatched = typeIn('delete') || typeIx(1);
    let insertIfNoTarget = typeIn('upsert', 'insert', 'full') || typeIx(2);
    let deleteIfNoSource = typeIn('full') || typeIx(3);

    let incomingBuckets = 
        new hashBuckets(sourceIdentityKey)
        .addItems(source);
    
    for (let t = target.length - 1; t >= 0; t--) {

        let sourceRow = 
            incomingBuckets.getBucketFirstItem(
                target[t], 
                targetIdentityKey,
                true 
            );

        if (sourceRow)
            if (deleteIfMatched)
                target.splice(t, 1);
            else if (updateIfMatched)
                target[t] = sourceRow;

        else if (deleteIfNoSource) // target but no source
            target.splice(t, 1);

    }

    if (insertIfNoTarget) {
            
        let remainingItems = // source but no target
            incomingBuckets.getBuckets()
            .map(bucket => bucket[0]);

        for(let item of remainingItems)  
            target.push(item);

    }

    return target;

}
