//import { sampleDataSets } from '../sampleDataSets.js';
//let dbConnectorMongo = require('../../src/dbConnectorMongo.js');
//let $$ = require('../../src/oneQuery.js');

//$$.mongo = url => new dbConnectorMongo(url);

/*
let db = 
    $$({
        sam: $$.mongo('mongodb://localhost:27017/sampleMongo'),
        c: sam => 'customers',
        o: sampleDataSets.orders
    })
    .filter(c => true)
    .map(c => ({ id: c.id, fullname: `name: ${c.fullname}`}))
    .execute();
*/

export let json = 'here';