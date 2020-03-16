async function test () {

    let data = await sample();

    // Will a hash failure change to loop?
        
        let results = 
            $$({
                p: data.philosophites,
                m: data.mathematicians
            })
            .merge(
                (p,m) => p.id == m.id || p.id == 'z', 
                'both both'
            )
            .get(p => p);

        checkBothBoth('hash fail', results);
            
    // Does the mapper as object of options work?  
        
        results = 
            $$({
                p: data.philosophites,
                m: data.mathematicians
            })
            .merge((p,m) => p.id == m.id, {
                leftHasher: x => x.id,
                rightHasher: x => x.id,
                mapper: 'both both'
            })
            .get(p => p);

        checkBothBoth('left right hashers', results);

    // Does the mapper as object of options work?  
        
        results = 
            $$({
                p: data.philosophites,
                m: data.mathematicians
            })
            .merge(
                (p,m) => p.id == m.id, {
                    hasher: x => x.id,
                    mapper: 'both both'
                },
                $$.mergeMethod.hash
            )
            .get(p => p);

        checkBothBoth('hashers', results);

    // Will merge work inside groupings?

        results = 
            $$({
                o: data.orders,
                c: data.customers
            })
            .group(o => o.customer)
            .map(c => ({...c, customer: c.id, id: undefined}))
            .merge(
                (o,c) => o.customer = c.customer,
                'both both'
            )
            .get(o => o);

        let sourceTag = 'Grouped Merge';

        if (results.length != 3) throw `
            Results should have 3 items.
            This doesn't seem to be the case for '${sourceTag}'.    
        `;
        if (
            Array.prototype.filter.call(
                results, 
                row => !Array.isArray(row)
            ).length != 0
        ) throw `
            Results should represent grouped data.'.
            This doesn't seem to be the case for '${sourceTag}'.    
        `;
        if (results[0].filter(row => row.customer == 1).length <= 1) throw `
            First row of results should primarially be customer 1.  
            This doesn't seem to be the case for '${sourceTag}'.    
        `;
        if (results[0].filter(row => row.customer == 2).length != 1) throw `
            First row of results should have exectly one record for 
            customer 2.  This doesn't seem to be the case 
            for '${sourceTag}'.
        `;

    // TODO: Merge on full object equality

        results = 
            $$({
                pc: data.potentialCustomers,
                s: data.shoplifters
            })
            .merge(
                (pc,s) => pc == s, 
                'both both', 
                $$.mergeMethod.hashDistinct // omit for union all
            )
            .get(pc => pc);

        console.log(results);

    return true;

}

function checkBothBoth (sourceTag, data) { 
    let looksGood = 
        data.filter(x => x.id == 'a').length == 1 &&
        data.filter(x => x.id == 'b').length == 1 &&
        data.filter(x => x.id == 'c').length == 1;
    if (!looksGood) throw `
        Results do not resemble the output of 'both both'.
        source = '${sourceTag}'; 
    `;
}