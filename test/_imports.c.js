import $$ from './dist/FluentDB.client.js';
import sampleClient from './node_modules/sampledb/dist/SampleDB.client.js';
import sampleIdb from './node_modules/sampledb/dist/SampleDB.idb.js';

var sample = stores => 
    sampleClient('/test/_SampleDB.json', stores)
    .data;

    