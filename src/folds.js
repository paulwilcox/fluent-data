import { parser } from './parser.js';

export let addStaticFolds = reciever => {

    let obj = {};
/*
    obj.key = (dataset, selector, errorOut = false, callback = null) => {

        let distinct = [...new Set(dataset.map(selector))];
        
        if (distinct.size > 1) {
            if (errorOut)
                throw "key() found more than one distinct value.";
            return null;
        }

        return callback ? callback(distinct[0]) : distinct[0];

    }
*/

    obj.sum = (dataset, selector, callback) => {
        let val =  
            dataset.map(selector)
            .map(f => parseFloat(f || 0))
            .reduce((a,b) => a + b);
        return callback ? callback(val) : val;
    }
/*
    obj.count = (dataset, selector, callback) => {
        let counter = 0;
        for (let element of dataset.map(selector))
            if (!isNaN(parseFloat(element))) 
                counter += 1;
        return callback ? callback(counter) : counter;
    }

    obj.avg = (dataset, selector, callback) => {
        let val = obj.sum(dataset, selector) / obj.count(dataset, selector);
        return callback ? callback(val) : val;
    }

    obj.std = (dataset, selector, callback) => {

        let avg = obj.avg(dataset, selector);

        let squaredDeviations = 
            dataset.map(selector)
            .map(x => (parseFloat(x) - avg) ** 2);

        let val = 
            (
                obj.sum(squaredDeviations, x => x) 
                / obj.count(dataset, selector)
            ) 
            ** (1/2);

        return callback ? callback(val) : val;

    }

    // "selector" must return an array with two elements
    // http://www.socscistatistics.com/tests/pearson/
    obj.cor = (dataset, selector, callback) => {

        let pairs = 
            dataset.map(selector)
            .map(pair => ({ 
                x: parseFloat(pair[0]),
                y: parseFloat(pair[1])
            }))
            .filter(pair => !isNaN(pair.x) && !isNaN(pair.y));

        let xAvg = obj.avg(pairs, pair => pair.x);
        let yAvg = obj.avg(pairs, pair => pair.y);
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
*/
    // create a version of the passed in function that outputs
    // an object with command directives so that a user can 
    // call a function with partial arguments.    
    let partializable = func => {

        let expectedArgs = parser.parameters(func);

        return (...args) => {

            let argNumbersMatch = args.length == expectedArgs.length;
            let firstArgIsArray = Array.isArray(args[0]);

            return argNumbersMatch || firstArgIsArray 
                ? func.apply(null, args)
                : { func, storedArguments: args };

        };

    }
    
    for(let key of Object.keys(obj)) 
        reciever[key] = partializable(obj[key]);

    reciever['sum2'] = (rowVal) => ({ rowVal, func: (a,b) => a + b });

}
