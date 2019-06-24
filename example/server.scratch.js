let sampleMongo = require('../dist/FluentDB.sampleMongo.js');
let $$ = require('../dist/FluentDB.server.next.js').$$;

module.exports.getJson = async function (resetMongo) {

    if (resetMongo)
        await sampleMongo('mongodb://localhost:27017/sampleMongo', true);

    return $$({
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
        .then(db => JSON.stringify(db));

}


