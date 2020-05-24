import $$$$ from '../src/fluent-data.js';
import sampleClient from '../node_modules/sampledb/dist/SampleDB.client.js';

async function sample (stores) { 
    let s = await sampleClient('./_SampleDB.json', stores);
    return s.data;
}

