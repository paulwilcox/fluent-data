let MongoClient = require('mongodb').MongoClient;
let sampleDataSets = require('./sampleData.server.js');

module.exports = (

    url = 'mongodb://localhost:27017/sampleData', 

    // omit to do no resets, 
    // pass true to reset from sampleData,
    // pass an {object} of key:data's to reset to that database
    // pass a 'key' to reset only that key from sampleData  
    reset = true,

    // set to true to delete any dataset not represented in reset
    deleteWhenNotInReset = false

) =>

    MongoClient.connect(url, { useNewUrlParser: true})
    .then(async client => {

        let db = client.db();
        let collections = await db.collections();

        if (!reset)
            return db;

        let dataset = 
            reset === true ? sampleDataSets
            : typeof reset === 'object' && Object.keys(reset).length > 0 ? reset
            : typeof reset === 'string' ? sampleDataSets[reset]
            : null;

        let deleteKeys = 
            deleteWhenNotInReset ? collections.map(c => c.s.name)
            : Object.keys(dataset);

        for (let key of deleteKeys) {                
            console.log('deleteing: ' + key);
            await db.dropCollection(key);
        }

        for (let key of Object.keys(dataset)) {
            console.log('creating: ' + key);
            await db.createCollection(key); 
            await db.collection(key).insertMany(dataset[key]);
        }

        return db;

    })
    .catch(err => console.log(err));

