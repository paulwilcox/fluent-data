import dataset from './dataset.js';
import matrix from './matrix.js';
import * as redu from './reducers.js';
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

dataset.prototype.dimReduce = function (...args) {
    return redu.dimReduce(...args)(this.data);
}

dataset.prototype.regress = function (...args) {
    return redu.regress(...args)(this.data);
}
