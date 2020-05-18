async function test () {

    let data = await sample();

    // Will a hash failure change to loop?
        
        let results = 
            $$(data.philosophites)
            .merge(
                data.mathematicians,
                (p,m) => p.id == m.id || p.id == 'z', 
                'both both'
            )
            .get();

        checkBothBoth('hash fail', results);
            
    // Does the mapper as object of options work?  
        
        results = 
            $$(data.philosophites)
            .merge(
                data.mathematicians,
                (p,m) => p.id == m.id, 
                {
                    leftHasher: x => x.id,
                    rightHasher: x => x.id,
                    mapper: 'both both'
                }
            )
            .get();

        checkBothBoth('left right hashers', results);

    // Does the mapper as object of options work?  
        
        results = 
            $$(data.philosophites)
            .merge(
                data.mathematicians,
                (p,m) => p.id == m.id, 
                {
                    hasher: x => x.id,
                    mapper: 'both both'
                },
                $$.mergeMethod.hash
            )
            .get();

        checkBothBoth('hashers', results);

    // Will merge work inside groupings?

        let customers = $$(data.customers).get(
            c => ({...c, customer: c.id})
        );

        results = 
            $$(data.orders)
            .group(o => o.customer)
            .merge(
                customers,
                (o,c) => o.customer = c.id,
                'both both'
            )
            .get();

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

    // Full object equality syntax (symmetric difference)

        sourceTag = 'set theoreticals' 

        results = 
            $$(data.potentialCustomers)
            .merge(data.shoplifters, '=', 'null both')
            .get();

        if (
            results.filter(row => [2,3,5].includes(row.id)).length != 3 ||
            results.filter(row => ![2,3,5].includes(row.id)).length != 0 
        ) throw `
            The results do not seem to reflect a symmetric difference
            for '${sourceTag}'.
        `;

        results = 
            $$(data.potentialCustomers)
            .merge(data.shoplifters, '=', 'both null')
            .get();

        if (
            results.length != 1 ||
            results[0].id != 4 
        ) throw `
            The results do not seem to reflect a union 
            for '${sourceTag}'.
        `;
    
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