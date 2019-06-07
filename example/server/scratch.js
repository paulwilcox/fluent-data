import { resetSampleMongo } from './resetSampleMongo.js';
import { dbConnectorMongo } from '../../src/dbConnectorMongo';
import { $$ } from '../../src/oneQuery.js';

// resetSampleMongo(); But be warned, this is async and so
// will likely run during after the code that follows it.

$$.mongo = url => new dbConnectorMongo(url);

let x = 
    $$({
        sam: $$.mongo('mongodb://localhost:27017/sampleMongo'),
        o: sam => 'orders'
    })
    .filter(o => o.customer == 1)
    .map(o => ({ 
        id: o.id, 
        customer: o.customer, 
        product: o.product,
        rating: o.rating 
    }))
    .group(o => o.rating <= 10)
    .execute()
    .then(obj => console.log(obj.datasets[0].data));

// TODO: json is empty.  Is the async nature of mongo causing this?
export let json = JSON.stringify(x); 

