import connectorMongo from './connectorMongo.js';
import $$ from './FluentDB.js';

$$.mongo = (collectionName, url) => new connectorMongo(collectionName, url);

export default $$;

