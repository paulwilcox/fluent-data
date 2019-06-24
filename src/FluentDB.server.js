import { dbConnectorMongo } from './dbConnectorMongo.js';
import $$, { FluentDB } from './FluentDB.js';

FluentDB.mongo = url => new dbConnectorMongo(url);
$$.mongo = url => new dbConnectorMongo(url);

export default { $$, FluentDB };

