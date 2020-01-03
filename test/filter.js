
let results = 
    $$({ 
        c: sample.customers,
        o: sample.orders  
    })
    .filter(o => o.customer == 2)
    .execute(o => o);

return results.filter(x => x.customer == 2).length > 0 
    && results.filter(x => x.customer != 2).length == 0;
