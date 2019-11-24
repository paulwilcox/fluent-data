import dbConnectorMongo from './dbConnectorMongo.js';
import $$ from './FluentDB.js';

$$.mongo = url => new dbConnectorMongo(url);

export default $$;

