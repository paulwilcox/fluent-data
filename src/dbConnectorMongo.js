import { dsGetterMongo } from './dsGetterMongo.js';
import { dbConnector } from './dbConnector.js';
import { MongoClient } from 'mongodb';

export class dbConnectorMongo extends dbConnector {

    constructor (url) {
        super();
        this.db = MongoClient.connect(url, { useNewUrlParser: true });
    }

    dsGetter(collectionName) {
        return new dsGetterMongo(collectionName, this.db);
    }

} 