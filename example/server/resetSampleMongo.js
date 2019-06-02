import { sampleDataSets } from '../sampleDataSets.js';
import { MongoClient } from 'mongodb';

let url = 'mongodb://localhost:27017/sampleMongo';

export let resetSampleMongo = () =>
    MongoClient.connect(url)
    .then(db => {

        for (let key of Object.keys(sampleDataSets)) {
            if (db[key]) 
                db[key].drop();
            db.createCollection(key);
            db[key].insertMany(sampleDataSets[key]);
        }

    })
    .catch(err => console.log(err));

