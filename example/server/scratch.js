import { resetSampleMongo } from './resetSampleMongo.js';
import { dbConnectorMongo } from '../../src/dbConnectorMongo';
import { $$ } from '../../src/oneQuery.js';

resetSampleMongo();
$$.mongo = url => new dbConnectorMongo(url);

let x = 
    $$({
        sam: $$.mongo('mongodb://localhost:27017/sampleMongo'),
        c: sam => 'customers'
    })
    .map(c => c)
    .execute();

export let json = JSON.stringify(x); 

