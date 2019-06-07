import { resetSampleMongo } from './resetSampleMongo.js';
import { dbConnectorMongo } from '../../src/dbConnectorMongo';
import { $$ } from '../../src/oneQuery.js';

// resetSampleMongo(); But be warned, this is async and so
// will likely run during after the code that follows it.

$$.mongo = url => new dbConnectorMongo(url);

let x = 
    $$({
        sam: $$.mongo('mongodb://localhost:27017/sampleMongo'),
        c: sam => 'customers'
    })
    .map(c => c)
    .execute();

// TODO: json is empty.  Is the async nature of mongo causing this?
export let json = JSON.stringify(x); 

