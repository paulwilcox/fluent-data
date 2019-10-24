// TODO: Create a way to only run certain tests or a single
// test if you want.  This should be both for the tests
// here as well as running certain createFDBs.

let seriToRun = null;
let testsToRun = null;

function name (testName, seriesName) {
    if(testsToRun && !testsToRun.includes(testName) && testsToRun != testName)
        return 'notest';
    if(seriToRun && !seriToRun.includes(seriesName) && seriToRun != seriesName)
        return 'notest';
    return testName;
}

export default async function(seriesName, createFDB) { 
    
    let n = testName => name(testName, seriesName);

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
            .join((o,p) => o.product == p.id)
            .test(n('join'), o => o, data => 
                Object.keys(data[0]).includes('price')
            ),

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