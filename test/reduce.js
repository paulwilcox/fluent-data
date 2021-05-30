async function test () {

    let data = await sample('orders');

    let results = 
        $$(data.orders)
        .reduce({
            firstCustomer: $$.first(o => o.customer), 
            speed: $$.avg(o => o.speed),
            rating: $$.avg(o => o.rating),
            speed_cor: $$.cor(o => [o.speed, o.rating]),
            nn: (acc,next) => acc += 1,
            ['nn.seed']: 100,
            n: $$.count(o => o.id)
        })
        .get();

    if (results.n != 12)     throw `results.n does not equal 12`;
    if (results.nn != 112)   throw `results.nn does not equal 112`;

    results = 
        $$(data.orders)
        .reduce({
            firstCustomer: $$.first(o => o.customer), 
            speed: $$.avg(o => o.speed),
            rating: $$.avg(o => o.rating),
            speed_cor: $$.cor(o => [o.speed, o.rating], { tails: 1 }),
            n: $$.count(o => o.id)
        })
        .get();

    if($$.round(results.speed_cor.pVal, 5) !=  0.01843) throw `
        results.speed_cor.pval does not round to 0.01843
    `;

    results = 
        $$(data.orders)
        .group(o => o.customer) 
        .reduce({
            customer: $$.first(o => o.customer), 
            speed: $$.avg(o => o.speed),
            rating: $$.avg(o => o.rating),
            speed_cor: $$.cor(o => [o.speed, o.rating])
        })
        .sort(o => o.customer)
        .get();

    let rprop = (ix,prop) => Math.round(results[ix][prop] * 100) / 100;

    if (results.length != 3) throw `results.length != 3`;
    if (rprop(0,'rating') != 58.29) throw `first row 'rating' != 58.29`;
    if (rprop(0,'speed') != 4.57) throw `first row 'speed' != 4.57`;
    if (rprop(0,'speed_cor') != 0.74) throw `first row 'speed_cor' != 0.74`;

    results = $$(data.orders)
        .window(
            { 
                n: $$.count(o => o.customer),
                groupRating: $$.avg(o => o.rating)
            },
            o => [o.customer, o.rating <= 100],
            o => o.rating,
            o => o.rating <= 100  
        )
        .scroll(
            { run: $$.count(o => o.customer)}, 
            o => [o.customer, o.rating <= 100],
            o => -o.rating, 
            (row,current,compare) => current >= compare && row.rating <= 100
        )
        .sort(o => [o.customer, o.rating])
        .get();

    if (results.length != 12) throw `results.length != 12`;
    if (rprop(7,'n') != 4) throw `8th row 'n' != 4`;
    if (rprop(7,'groupRating' != 44.5)) throw `8th row 'groupRating' != 44.5`;
    if (rprop(8,'run') != 3) throw `9th row 'run' != 3`;
    if (!isNaN(rprop(6,'groupRating'))) 
        throw `7th row 'groupRating' is a number (it should be NAN)`; 

    return true;

}