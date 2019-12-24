import parser from './parser.js';
import hashBuckets from './hashBuckets.js';
import * as g from './general.js';

export default function* (leftData, rightData, matchingLogic, mapFunc, distinct) {

    let mapper = normalizeMapper(mapFunc, matchingLogic);

    let keyFuncs = parser.pairEqualitiesToObjectSelectors(matchingLogic);
    let targetKeyFunc = keyFuncs.leftFunc;
    let sourceKeyFunc = keyFuncs.rightFunc;    
    let processedTargets = new hashBuckets(targetKeyFunc, true);

    let incomingBuckets = 
        new hashBuckets(sourceKeyFunc, distinct)
        .addItems(rightData);

    for (let targetRow of leftData) {
            
        // If user wants distinct rows in the target, then
        // track if such a row has already been processed.
        // If so, delete future rows in the target.  If not,
        // just record that it has now been processed.
        if (distinct) {  
            let processedTarget = processedTargets.getBucket(targetRow, targetKeyFunc);
            if (processedTarget)
                continue;
            processedTargets.addItem(targetRow);
        }

        // Finds the bucket of incoming rows matching the 
        // target and 'crossMaps' them.  Returns a generator. 
        let outputGenerator = incomingBuckets.crossMapRow(
            targetRow, 
            targetKeyFunc,
            mapper
        );

        // Flatten the output to ensure that a whole array
        // is not returned.
        for(let outputYield of outputGenerator) {
            yield outputYield; 
            if (distinct)
                continue;
        }

    }


}

function normalizeMapper (mapFunc, matchingLogic) {

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
