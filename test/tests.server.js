/**
 * ISC License (ISC)
 * Copyright (c) 2019, Paul Wilcox <t78t78@gmail.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

'use strict';

var tests = async (seriesName, createFDB) =>
    
    Promise.all([

        createFDB()
            .filter(o => o.customer == 2)
            .test(
                'filter', 
                o => o,
                data =>  
                    data.filter(x => x.customer == 2).length > 0 
                    && data.filter(x => x.customer != 2).length == 0
            )
            
    ])
    .then(res => {
        for(let row of res) {
            row.passStatus = row.result;
            row.seriesName = seriesName;
            row.name = row.testName;
        }
        return res;
    }); 

/*
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

    // join 

        data = await createFDB()
            .join((o,p) => o.product == p.id)
            .execute(o => o);

        await reg('join', 
            Object.keys(data[0]).includes('price')
        );

    // merge

        if (seriesName == 'idbHybridLeft')
        data = await createFDB()
            .merge('upsert', c => c.id, pc => pc.id)
            .merge('delete', c => c.id, s => s.id)
            .execute();  
            
        await reg('merge', 
               data.find(row => row.id == 2).fullName == 'Johnathan Doe'
            && data.filter(row => row.id == 4 || row.id == 5).length == 0
        );

    // terminate

        return results;
*/

module.exports = tests;
