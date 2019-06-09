import { dbConnectorMongo } from './dbConnectorMongo.js';
import { oneQuery, $$ } from './oneQuery.js';

oneQuery.mongo = url => new dbConnectorMongo(url);
$$.mongo = url => new dbConnectorMongo(url);

export default { oneQuery, $$ };