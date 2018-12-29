import * as general from "./general.js";

// This class exists because of how IndextDb get cursor 
// works.  It simultaneously asks for a selector and a
// filter statement.  But we want the user to apply these
// seperately.  But depending on the next command, the
// cursor needs to be run first (resolved), or it needs
// to be held off for further configuration (unresolved);
// Namely, if a single filter is applied, it can still
// take a selector before executing.
export let unresolvedIdb = class {

    constructor (storeName, transaction) {
        this.storeName = storeName;
        this.transaction = transaction;
        this.explicitFilter = null;
        this.explicitSelector = null;
        this.realiased = false;
    }

    setFilter (filter) {
        this.explicitFilter = filter; 
        return this.getReturnType();
    }

    setSelector (selector) {
        this.explicitSelector = selector;
        return this.getReturnType();
    }

    getReturnType () {
        return this.explicitSelector != null 
            ? this.resolve() 
            : this;
    }
    
    resolve() {

        let results = [];

        this.transaction
        .objectStore(this.storeName)
        .iterateCursor(cursor => {

            if (!cursor) 
                return;

            let val = cursor.value;

            let passesFilter =
                  this.explicitFilter == null ? true
                : this.explicitFilter(val);

            if(passesFilter) 
                results.push(
                    this.explicitSelector != null 
                    ? this.explicitSelector(val)
                    : val
                );

            cursor.continue();

        });

        return this.transaction.complete
            .then(() => results);

    }
        
}
