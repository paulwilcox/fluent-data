class database {

    constructor(obj) {

        this.datasets = {};
        this.funcs = [];
        this.funcStrings = [];

        addDatasets(obj);

    }

    addDatasets (obj) {
        for(let key of Object.keys(obj)) 
            addDataset(key, obj[key]);
    }

    // we want to add the dataset in line with 'then' orderings 
    addDataset (key, data) { then(addDatasetCore(key, data)); }

    addDatasetCore (key, data) {
        
        if (isPromise(this.datasets) || isPromise(data)) 

            this.datasets =
                Promise.all([this.datasets, key, data])
                .then(pa => 
                    pa[0].push({ key: pa[1], data: pa[2]})
                );

        else 
            this.datasets.push({ key, data });

    }

    then (func) {
        this.funcs.push(func);
        this.funcStrings.push(func.toString());
        return this;
    }

    execute(finalFunc) {

        for (let func of this.funcs) 
            this.datasets = 
                isPromise(this.datasets)
                ? this.datasets.then(func)
                : func(this.datasets);

        if (arguments.length > 0)
            return finalFunc(this.datasets);

    }

    isPromise = obj => Promise.resolve(obj) == obj;

}

class datasetGetter {
    map() { throw "Please override 'map'."}
    filter() { throw "Please override 'filter'."}
}

class datasetGetterIdb extends datasetGetter {

    constructor (dbName, storeName) {
        super();
        this.dbName = dbName;
        this.storeName = storeName;
        this.filterFunc;
    }

    filter(filterFunc) {

        if (!this.filterFunc) 
            this.filterFunc = filterFunc;
        else 
            this.config.filterFunc = this.config.filterFunc && filterFunc;

        return this;

    }

    // thanks netchkin at https://stackoverflow.com/questions/46326212/
    // how-to-return-indexeddb-query-result-out-of-event-handler
    map(mapFunc) {

        return new Promise((resolve, reject) => {

            let dbCon = indexedDB.open(this.dbName);
            
            dbCon.onsuccess = () => {

                let db = dbCon.result;
                let tx = db.transaction(this.storeName);
                let store = tx.objectStore(this.storeName);
                let filterFunc = this.filterFunc || (x => true);
                let results = [];

                let storeCursor = store.openCursor();
                
                storeCursor.onsuccess = event => {

                    let cursor = event.target.result;

                    if (!cursor) {
                        resolve(results);
                        return;
                    }

                    if (filterFunc(cursor.value))
                        results.push(
                            mapFunc(cursor.value)
                        );

                    cursor.continue();

                } 
                
                storeCursor.onerror = event => reject(event);
                tx.oncomplete = () => db.close(); 
                tx.onerror = event => reject(event); 

            };

            dbCon.onerror = event => reject(event); 

        });

    }

}

export let result = 
    new datasetGetterIdb('sampleIdb', 'products')
    .filter(x => x.price >= 2)
    .map(x => { x.newProp = x.price ** 2; return x });
