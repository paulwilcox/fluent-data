let MongoClient = require('mongodb').MongoClient;
let sampleDataSets = require('./sampleData.server.js');

module.exports = (

    url = 'mongodb://localhost:27017/sampleData', 

    // omit to do no resets, 
    // pass true to reset from sampleData,
    // pass an {object} of key:data's to reset to that database
    // pass a 'key' to reset only that key from sampleData  
    reset = false,

    // set to true to delete any dataset not represented in reset
    deleteWhenNotInReset = false

) =>

    MongoClient.connect(url, { useNewUrlParser: true})
    .then(async client => {

        let db = client.db();
        let collections = await db.collections();
        let collectionNames = await collections.map(c => c.s.name);

        if (!reset)
            return db;

        let datasets = 
            reset === true ? sampleDataSets
            : typeof reset === 'object' && Object.keys(reset).length > 0 ? reset
            : typeof reset === 'string' ? { [reset]: sampleDataSets[reset] }
            : null;

        let deleteKeys = 
            deleteWhenNotInReset 
            ? collectionNames
            : Object.keys(datasets);

        for (let key of deleteKeys) {                
            if (collectionNames.indexOf(key) == -1)
                continue;
            console.log('deleteing: ' + key);
            await db.dropCollection(key);
        }

        for (let key of Object.keys(datasets)) {
            console.log('creating: ' + key);
            await db.createCollection(key); 
            await db.collection(key).insertMany(datasets[key]);
        }

        return db;

    })
    .catch(err => console.log(err));

