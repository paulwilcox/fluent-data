let $$ = require('../dist/FluentDB.server.next.js');

module.exports = async function () {
/*
    return $$({
            sam: $$.mongo('mongodb://localhost:27017/SampleDB'),
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
        .reduce(o => ({ avgRating: $$.avg(o.rating) }))
        .catch(err => console.log(err))
        .execute(o => o)
        .then(db => JSON.stringify(db));
*/

        return $$({
                sam: $$.mongo('mongodb://localhost:27017/SampleDB'),
                c: sam => 'customers',
                pc: sam => 'potentialCustomers',
                s: sam => 'shoplifters'
            })
            .merge('upsert', c => c.id, pc => pc.id)
            .merge('delete', c => c.id, s => s.id)
            .test('merge', c => c, data =>  
                data.find(row => row.id == 2).fullname == 'Johnathan Doe' && 
                data.filter(row => row.id == 4 || row.id == 5).length == 0
            )
            .then(res => JSON.stringify(res));



}
