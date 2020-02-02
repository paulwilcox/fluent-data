import $$$$ from '../dist/FluentDB.client.js';
import sampleClient from '../node_modules/sampledb/dist/SampleDB.client.js';
import sampleIdb from '../node_modules/sampledb/dist/SampleDB.idb.js';

async function sample (stores) { 
    let s = await sampleClient('./_SampleDB.json', stores);
    return s.data;
}
