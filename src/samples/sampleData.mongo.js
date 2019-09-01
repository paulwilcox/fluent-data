let MongoClient = require('mongodb').MongoClient;
let sampleDataSets = require('./sampleData.server.js');

module.exports = (
    url = 'mongodb://localhost:27017/sampleData', 
    reset = true
) =>
    MongoClient.connect(url, { useNewUrlParser: true})
    .then(async client => {

        let db = client.db();
        let collections = await db.collections();

        if (reset) {

            let data = 
                Object.keys(reset).length > 0 
                ? reset 
                : sampleDataSets;

            for (let key of collections.map(c => c.s.name)) {                
                console.log('deleteing: ' + key);
                await db.dropCollection(key);
            }

            for (let key of Object.keys(data)) {
                console.log('creating: ' + key);
                await db.createCollection(key); 
                await db.collection(key).insertMany(data[key]);
            }

        }

        return db;

    })
    .catch(err => console.log(err));

