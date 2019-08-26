import * as g from '../src/general.js';

export default async function (seriesName, createFDB) {

    // initializations
        
        let results = [];
        let data;
        let reg = (name, passStatus) => 
            register(results, data, seriesName, name, passStatus); 

    // filter
        
        data = await createFDB()
            .filter(o => o.customer == 2)
            .execute(o => o);

        await reg('filter', 
               data.filter(x => x.customer == 2).length > 0 
            && data.filter(x => x.customer != 2).length == 0
        ); 

    // map

        data = await createFDB()
            .map(o => ({
                customer: o.customer,
                rating: o.rating,
                flag: o.rating < 10 ? 'bad' : o.rating < 50 ? 'okay' : 'good'
            }))
            .execute(o => o);

        await reg('map',
               Object.keys(data[0]).includes('customer') 
            && !Object.keys(data[0]).includes('id')
        );

        return results;

}

async function register (results, data, seriesName, name, passStatus) {

    if (g.isPromise(data)) 
        await data.then(() => results.push({seriesName, name, passStatus}));
    else
        await results.push({seriesName, name, passStatus});

    return results;

}    

