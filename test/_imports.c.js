import $$$$ from '../dist/FluentDB.client.js';
import sampleClient from '../node_modules/sampledb/dist/SampleDB.client.js';
import _sampleIdb from '../node_modules/sampledb/dist/SampleDB.idb.js';

async function sample (stores) { 
    let s = await sampleClient('./_SampleDB.json', stores);
    return s.data;
}

async function sampleIdb(
    stores = null, 
    deleteIfKeyNotFound = true
) {
    let s = await _sampleIdb('SampleDB')
        .reset('/test/_SampleDB.json', stores, deleteIfKeyNotFound)
        .connect();
    return s;
}