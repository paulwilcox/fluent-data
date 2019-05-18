let dsGetterMongo = require('./dsGetterMongo.js');

module.exports.dbConnectorMongo = class {

    constructor (url) {
        super();
        this.db = MongoClient.connect(url, { useNewUrlParser: true });
    }

    dsGetter(collectionName) {
        return new dsGetterMongo(collectionName, this);
    }

} 