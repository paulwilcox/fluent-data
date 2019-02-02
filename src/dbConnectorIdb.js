import { dbConnector } from './dbConnector.js';
import { dsGetterIdb } from './dsGetterIdb.js';

export class dbConnectorIdb extends dbConnector {

    constructor (dbName) {
        super();
        this.dbName = dbName;
    }

    open() {
        return window.indexedDB.open(this.dbName);
    }

    dsGetter(storeName) {
        return new dsGetterIdb(storeName, this);
    }

} 