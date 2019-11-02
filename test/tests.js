import $$ from "../dist/FluentDB.client.js";

// TODO: Implement testing structure for FluentDB.mergeExternal,
// or just do direct tests, because it is not really covered here.

export default class {

    constructor (seriToRun, testsToRun) {
        this.seriToRun = seriToRun;
        this.testsToRun = testsToRun;
    }

    name (testName, seriesName) {
        let compare = (x,y) => x !== undefined && !x.includes(y) && x != y;
        return compare(this.testsToRun, testName) ? 'notest'
            : compare(this.seriToRun, seriesName) ? 'notest'
            : testName;
    }

    async run (seriesName, createFDB) { 
        
        let n = testName => this.name(testName, seriesName);

        return Promise.all([

            createFDB()
                .filter(o => o.customer == 2)
                .test(n('filter'), o => o, data => 
                    data.filter(x => x.customer == 2).length > 0 && 
                    data.filter(x => x.customer != 2).length == 0
                ),

            createFDB()
                .map(o => ({
                    customer: o.customer,
                    rating: o.rating,
                    flag: o.rating < 10 ? 'bad' : o.rating < 50 ? 'okay' : 'good'
                }))
                .test(n('map'), o => o, data =>
                    Object.keys(data[0]).includes('customer') && 
                    !Object.keys(data[0]).includes('id')
                ),

            createFDB() 
                .sort((o,o2) => // 'o2' is free, in that it doesn't matter what you name it
                    o.customer > o2.customer ? 1
                    : o.customer < o2.customer ? -1  
                    : o.rating > o2.rating ? -1 
                    : o.rating < o2.rating ? 1
                    : 0
                )
                .test(n('sort'), o => o, data => {
                    for(let i = 1; i < data.length; i++) {
                        let prv = data[i-1];
                        let cur = data[i];
                        return prv.customer <= cur.customer && prv.rating >= cur.rating;
                    }
                }),

            createFDB()
                .join((o,p) => o.product == p.id)
                .test(n('join'), o => o, data => 
                    Object.keys(data[0]).includes('price')
                ),

            createFDB()
                .group(o => o.customer) // if you don't group, '.reduce' will still output an array (with one item)
                .reduce(o => ({
                    customer: $$.first(o.customer), 
                    speed: $$.avg(o.speed),
                    rating: $$.avg(o.rating),
                    speed_cor: $$.cor(o.speed, o.rating)
                }))
                .test(n('groupReduce'), o => o, data => {
                    let row0 = prop => Math.round(data[0][prop] * 100) / 100;
                    return data.length == 3
                        && row0('rating') == 58.29
                        && row0('speed') == 4.57
                        && row0('speed_cor') == 0.74;
                }),

            createFDB()
                .merge('upsert', c => c.id, pc => pc.id)
                .merge('delete', c => c.id, s => s.id)
                .test(n('merge'), c => c, data =>  
                    data.find(row => row.id == 2).fullname == 'Johnathan Doe' && 
                    data.filter(row => row.id == 4 || row.id == 5).length == 0
                )

        ])
        .then(res => 
            res
            .filter(row => row !== undefined)
            .map(row => ({
                passStatus: row.result,
                seriesName,
                name: row.testName
            }))
        ); 

    }

}