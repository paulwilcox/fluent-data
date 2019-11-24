import parser from './parser.js';
import buckles from './buckles.js';
import { removeUndefinedKeys } from './mapper.js';
import * as g from './general.js';

export default function (leftData, rightData, matchingLogic, mapFunc, onDuplicate) {

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
            case 'both': return removeUndefinedKeys(Object.assign({}, right, left));
            case 'thob': return removeUndefinedKeys(Object.assign({}, left, right));
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

    let parsed = parser.pairEqualitiesToObjectSelectors(matchingLogic);

    if (!parsed)
        throw   'Could not parse function into object selectors.  ' +
                'Pass object selectors explicitly or use loop join instead';

    return {
        leftFunc: parsed.leftFunc,
        rightFunc: parsed.rightFunc || parsed.leftFunc
    }; 

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
