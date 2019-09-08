/**
 * ISC License (ISC)
 * Copyright (c) 2019, Paul Wilcox <t78t78@gmail.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

'use strict';

let isPromise = obj => 
    Promise.resolve(obj) == obj;

async function tests (seriesName, createFDB) {

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

    if (isPromise(data)) 
        await data.then(() => results.push({seriesName, name, passStatus}));
    else
        await results.push({seriesName, name, passStatus});

    return results;

}

module.exports = tests;
