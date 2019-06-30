import { aggregator } from './aggregator.js';
import $$ from './FluentDB.js';

// This is where you would want other developers to 
// plug-in new functions.
//
// aggregators is an object of functions that return 
// aggregators.  If it had direct aggregators, then
// any repeated use of the same property (such as using
// sum twice, would refer to the same aggregator instance).
export let aggregators = {
    
    first: () => new aggregator().aggregate((a,b) => a, null, a => a != null),
    last: () => new aggregator().aggregate((a,b) => b),
    sum: () => new aggregator().aggregate((a,b) => a + b),
    count: () => new aggregator().aggregate((a,b) => a + 1, 0),

    avg: () => 
        new aggregator()
        .emulators(v => ({ 
            sum: $$.sum(v), 
            count: $$.count(v) 
        }))
        .changeAggregated(agg => agg.sum / agg.count),

    mad: () => 
        new aggregator()
        .emulators(v => $$.avg(v))
        .changeData((dataRow,agg) => Math.abs(dataRow - agg)) 
        .emulators(v => $$.avg(v))

}

// Load emulators into $$ so that user calls $$.aggFunc(val)
// instead of new aggregator.emulator(val, 'aggFunc');
export function addAggregators (obj) {
        
    for (let aggregatorName of Object.keys(aggregators))
        obj[aggregatorName] = 
            value => new aggregator.emulator(value, aggregatorName); 

}
