
async function test () {

    let data = await sample('orders');

    data.orders[5].rating = null; // to test that it works well with a null value

    let results = 
        $$(data.orders)
        .group(o => o.customer)
        .standardize({ 
            ratingz: o => o.rating,
            speed: o => o.speed
        }, true) // setting to true to compare with r output
        .get(o => $$.round(o,1e-8));

    if(results[0][0].ratingz != -0.66382412)
        throw 'first row of customer = 1 does not have ratingz = -0.66382412';
    
    if(results[0][3].ratingz != null)
        throw 'third row of customer = 1 does not have ratingz = null';

    return true;
    
}