let MongoClient = require('mongodb').MongoClient;
let sampleDataSets = require('./sampleFDB.coreServer.js');

module.sample = sampleDataSets;

module.exports = (
    url = 'mongodb://localhost:27017/sampleFDB', 
    reset = true
) =>
    MongoClient.connect(url, { useNewUrlParser: true})
    .then(async client => {

        let db = client.db();
        let collections = await db.collections();

        if (reset)
        for (let key of Object.keys(sampleDataSets)) {
            console.log('processing: ' + key);
            if (collections.map(c => c.s.name).includes(key))                
                await db.dropCollection(key);
            await db.createCollection(key); 
            await db.collection(key).insertMany(sampleDataSets[key]);
        }

        return db;

    })
    .catch(err => console.log(err));

