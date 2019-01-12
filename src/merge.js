import { hashBuckets } from "./hashBuckets.js";

export function mergeIntoDataset (
    target,
    source,
    identityKey,
    mergeAction = () => "upsert"
) {

    let incomingBuckets = 
        new hashBuckets(identityKey)
        .addItems(source);
    
    for (let t = target.length - 1; t >= 0; t--) {

        let targetRow = target[t];
        let trMergeAction = mergeAction(targetRow);

        if (trMergeAction == "remove")
            target.splice(t, 1);

        else if (trMergeAction == "upsert") {

            let sourceRow = 
                incomingBuckets.getBucketFirstItem(
                    targetRow, 
                    identityKey,
                    true 
                );

            if (sourceRow)
                target[t] = sourceRow;

        }

    }

    let remainingItems = 
        incomingBuckets.getBuckets()
        .map(bucket => bucket[0]);

    for(let item of remainingItems)  
        target.push(item);

    return target;

}


export function mergeIntoIdb (
    idbPromise,
    target, 
    source, 
    identityKey,
    mergeAction = () => "upsert"
) {

    let incomingBuckets = 
        new hashBuckets(identityKey)
        .addItems(source);

    idbPromise
    .then (db => {
        let tx = db.transaction(target, "readwrite");
        let store = tx.objectStore(target);    
        return Promise.all([store.openCursor(), store])
    })
    .then(function executeCursor (arr) {

        let cursor = arr[0];
        let store = arr[1];

        if (!cursor)
            return store;

        let targetRow = cursor.value;
        let trMergeAction = mergeAction(targetRow);

        if (trMergeAction == "remove")
            cursor.delete;

        else if (trMergeAction == "upsert") {

            let sourceRow = 
                incomingBuckets.getBucketFirstItem(
                    targetRow, 
                    identityKey,
                    true 
                );

            if (sourceRow)
                cursor.update(sourceRow);

        }

        return Promise.all([
                cursor.continue(), 
                store
            ])
            .then(executeCursor);

    })
    .then(store => {

        let remainingItems = 
            incomingBuckets.getBuckets()
            .map(bucket => bucket[0]);

        for(let item of remainingItems) 
            store.put(item);

    });

}
