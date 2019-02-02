import { deferable } from './deferable.js';
import { database } from './database.js';
import { dbConnectorIdb } from './dbConnectorIdb.js';

export class oneQuery extends deferable {
    constructor() {
        super(new database());
    }
}

deferable.deferify(
    oneQuery.prototype, 
    'addSources, filter, map'
);

export let $$ = obj => new oneQuery().addSources(obj);

oneQuery.idb = dbName => new dbConnectorIdb(dbName);
$$.idb = oneQuery.idb;