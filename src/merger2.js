import { parser } from './parser.js';
import cobuckets from './cobuckets.js';
import { thenRemoveUndefinedKeys } from './mapper.js';
import * as g from './general.js';

export default function (leftData, rightData, matchingLogic, mapper, onDuplicate) {

    let { leftFunc, rightFunc } = parseMatchingLogic(matchingLogic);

    if (onDuplicate == 'distinct')
        onDuplicate = 'dist';

    if (onDuplicate !== undefined && !['first', 'last', 'dist'].includes(onDuplicate))
        throw 'onDuplicate must be one of: first, last, distinct, dist, or it must be undefined.';

    mapper = normalizeMapper(mapper);

    return [...new cobuckets(leftFunc)
        .add(0, leftFunc, onDuplicate, ...leftData)
        .add(1, rightFunc, onDuplicate, ...rightData)
        .crossMap(mapper)
    ];

}

function normalizeMapper (mapper) {

    if (!mapper)
        mapper = 'both null'; // inner join by default

    if (g.isString(mapper)) {

        let keywords = mapper.split(' ');
        let onMatched = keywords[0];
        let onUnmatched = keywords[1];
        let allowedTerms = ['both', 'left', 'right', 'null', 'stack'];

        if (!allowedTerms.includes(onMatched) || !allowedTerms.includes(onUnmatched))
            throw 'mapper must be one of: both, left, right, null, stack';

        return (left,right) => mergeByKeywords(left, right, onMatched, onUnmatched);

    }

    if (!parametersAreEqual(matchingLogic, mapper))
        throw 'Cannot merge.  Parameters for "mapper" and "matchingLogic" do not match"';

    return mapper;

}

function mergeByKeywords (left, right, onMatched, onUnmatched) {

    if(left && right)
        switch(onMatched) {
            case 'both': return thenRemoveUndefinedKeys(Object.assign({}, right, left));
            case 'left': return left;
            case 'right': return right;
            case 'null': return undefined;
            case 'stack': return [left, right]; 
        }

    switch(onUnmatched) {
        case 'both': return right || left;
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
