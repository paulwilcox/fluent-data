
async function test () {

    let data = await sample('orders');

    let results = 
        $$({ o: data.orders })
        .group(o => o.customer) 
        .get(o => o);

    if (results.length != 3) throw `
        Results should have 3 groups.  
        This does not seem to be the case`;

    results = 
        $$({ o: data.orders })
        .group(o => o.customer)
        .group(o => o.rating >= 10) 
        .get(o => o);

    for(let entry of results) 
        if (!Array.isArray(entry)) throw `
            Results should have groups.  
            This does not seem to be the case.`;

    // Also implicitly testing to see if map works with
    // nested groupings as desired             
    results = 
        $$({ o: data.orders })
        .group(o => o.customer)
        .map(o => ({ c: o.customer, p: o.product })) 
        .group(o => o.rating >= 10)
        .map(o => ({ cust: o.c, prod: o.p })) 
        .get(o => o);    

    for (let group of results)
    for (let subgroup of group) 
        if (!Array.isArray(subgroup)) throw `
            Results should have subgroups.   
            This does not seem to be the case.`;

    if (results[0][0].filter(item => item.cust != 1).length > 0)
        throw 'results[0][0] has an item with cust != 1.';

    results = 
        $$({ o: data.orders })
        .group(o => o.customer)
        .group(o => o.rating >= 10)
        .ungroup(o => o)
        .get(o => o);    

    for(let group of results)
    for(let item of group) 
        if (Array.isArray(item)) throw `
            Results seems to be nested more than one level deep.
            Ungroup should have made this not be the case.
        `;
    
    return true;

}