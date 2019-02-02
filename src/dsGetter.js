export class dsGetter {

    constructor(dbConnector) {
        this.dbConnector = dbConnector;
    }

    map() { throw "Please override 'map'." }
    filter() { throw "Please override 'filter'." }
    print() { throw "Please override 'print'." }
    merge() { throw "Please override 'merge'." }

}