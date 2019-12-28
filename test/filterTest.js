// TODO: The goal is to just write the test like this,
// and have exteranl logic convert it to client
// or server function with appropriate error
// handling, import handling, and test-naming.

let results = 
    $$({ 
        c: sample.customers,
        o: sample.orders  
    })
    .filter(o => o.customer == 2)
    .execute(o => o);

return results.filter(x => x.customer == 2).length > 0 
    && results.filter(x => x.customer != 2).length == 0;
