import dataset from './dataset.js';
import matrix from './matrix.js';
import dimReduce from './reducers/dimReduce.js';
import regress from './reducers/regress.js';
import * as redu from './reducers/general.js';
import * as g from './general.js';

export default function _(obj) { 
    if (!g.isIterable(obj))
        throw 'Object instantiating fluent_data must be iterable';
    return obj instanceof dataset ? obj : new dataset(obj);
}

_.dataset = dataset;
_.matrix = matrix;
_.round = g.round;

Object.assign(_, redu);
_.regress = regress;
_.dimReduce = dimReduce;
