import { parser } from './parser.js';

export let addStaticFolds = oneQueryObj => {

    let oneQueryKeysStart = new Set(Object.keys(oneQueryObj));

    oneQueryObj.key = (dataset, selector, errorOut = false, callback = null) => {

        let distinct = [...new Set(dataset.map(selector))];
        
        if (distinct.size > 1) {
            if (errorOut)
                throw "oneQuery.key found more than one distinct value.";
            return null;
        }

        return callback ? callback(distinct[0]) : distinct[0];

    }

    oneQueryObj.sum = (dataset, selector, callback) => {
        let val =  
            dataset.map(selector)
            .map(f => parseFloat(f || 0))
            .reduce((a,b) => a + b);
        return callback ? callback(val) : val;
    }

    oneQueryObj.count = (dataset, selector, callback) => {
        let counter = 0;
        for (let element of dataset.map(selector))
            if (!isNaN(parseFloat(element))) 
                counter += 1;
        return callback ? callback(counter) : counter;
    }

    oneQueryObj.avg = (dataset, selector, callback) => {
        let val = oneQueryObj.sum(dataset, selector) / oneQueryObj.count(dataset, selector);
        return callback ? callback(val) : val;
    }

    oneQueryObj.std = (dataset, selector, callback) => {

        let avg = oneQueryObj.avg(dataset, selector);

        let squaredDeviations = 
            dataset.map(selector)
            .map(x => (parseFloat(x) - avg) ** 2);

        let val = 
            (
                oneQueryObj.sum(squaredDeviations, x => x) 
                / oneQueryObj.count(dataset, selector)
            ) 
            ** (1/2);

        return callback ? callback(val) : val;

    }

    // "selector" must return an array with two elements
    // http://www.socscistatistics.com/tests/pearson/
    oneQueryObj.cor = (dataset, selector, callback) => {

        let pairs = 
            dataset.map(selector)
            .map(pair => ({ 
                x: parseFloat(pair[0]),
                y: parseFloat(pair[1])
            }))
            .filter(pair => !isNaN(pair.x) && !isNaN(pair.y));

        let xAvg = oneQueryObj.avg(pairs, pair => pair.x);
        let yAvg = oneQueryObj.avg(pairs, pair => pair.y);
        let n = pairs.length;

        let numerator = 0;
        let denX = 0;
        let denY = 0;

        for (let pair of pairs) {
            numerator += (pair.x - xAvg) * (pair.y - yAvg);
            denX += (pair.x - xAvg) ** 2;
            denY += (pair.y - yAvg) ** 2;
        }

        let val = numerator / (denX ** 0.5 * denY ** 0.5);
        
        return callback ? callback(val) : val;


    }

    // create a version of the passed in function that outputs
    // an object with command directives so that a user can 
    // call a function with partial arguments.    
    let partializable = func => {

        let expectedArgs = new parser(func).parameters;

        return (...args) => {

            let argNumbersMatch = args.length == expectedArgs.length;
            let firstArgIsArray = Array.isArray(args[0]);

            return argNumbersMatch || firstArgIsArray 
                ? func.apply(null, args)
                : { func, storedArguments: args };

        };

    }

    let oneQueryKeysEnd = new Set(Object.keys(oneQueryObj));
    let oneQueryKeysNew = [...oneQueryKeysEnd].filter(x => !oneQueryKeysStart.has(x));

    for (let newoneQueryKey of oneQueryKeysNew) 
        oneQueryObj[newoneQueryKey] = partializable(oneQueryObj[newoneQueryKey]);
    
}
