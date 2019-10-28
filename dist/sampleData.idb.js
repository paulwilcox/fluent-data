/**
 * ISC License (ISC)
 * Copyright (c) 2019, Paul Wilcox <t78t78@gmail.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

var sample = {

    products: [
        { id: 123456, price: 5 },
        { id: 123457, price: 2 },
        { id: 123458, price: 1.5 },
        { id: 123459, price: 4 }
    ],        

    customers: [
        { id: 1, fullname: "Jane Doe" },
        { id: 2, fullname: "John Doe" }
    ],  

    potentialCustomers: [
        { id: 2, fullname: "Johnathan Doe" },
        { id: 3, fullname: "John Q. Public" },
        { id: 4, fullname: "John J. Gingleheimer-Schmidt" }
    ],

    shoplifters: [
        { id: 4, fullname: "John J. Gingleheimer-Schmidt" },
        { id: 5, fullname: "Sneaky Pete" }
    ],

    orders: [
        { id: 901, customer: 1, product: 123456, speed: 1, rating: 2 },
        { id: 902, customer: 1, product: 123457, speed: 2, rating: 7 },
        { id: 903, customer: 2, product: 123456, speed: 3, rating: 43 },
        { id: 904, customer: 2, product: 123457, speed: 4, rating: 52 },
        { id: 905, customer: 1, product: 123459, speed: 5, rating: 93 },
        { id: 906, customer: 1, product: 123459, speed: 6, rating: 74 },
        { id: 907, customer: 2, product: 123458, speed: 7, rating: 3 },
        { id: 908, customer: 2, product: 123458, speed: 8, rating: 80 },
        { id: 909, customer: 1, product: 123459, speed: 7, rating: 23 },
        { id: 910, customer: 1, product: 123459, speed: 8, rating: 205 },
        { id: 911, customer: 1, product: 123459, speed: 3, rating: 4 },
        { id: 912, customer: 7, product: 123457, speed: 2, rating: 6 } // notice no customer 7 (use for outer joins)
    ],    

    students: [
        { id: "a", name: "Andrea" },
        { id: "b", name: "Becky" },
        { id: "c", name: "Colin" }
    ],

    foods: [
        { id: 1, name: 'tacos' },
        { id: 2, name: 'skittles' },
        { id: 3, name: 'flan' }
    ],

    scores: [
        {id: 1, student: "a", score: 5 },
        {id: 2, student: "b", score: 7 },
        {id: 3, student: "c", score: 10 },
        {id: 4, student: "a", score: 0 },
        {id: 5, student: "b", score: 6 },
        {id: 6, student: "c", score: 9 }
    ]

};

async function sampleData_idb (
    
    dbName, 

    // omit to do no resets, 
    // pass true to reset from sampleData,
    // pass an {object} of key:data's to reset to that database
    // pass an [{key,keyPath,data}] to reset to that database with keypaths
    // pass a 'key' to reset only that key from sampleData          
    reset = false,

    // set to true to delete any dataset not represented in reset
    deleteWhenNotInReset = false 
    
) {
    
    let fullReset = reset === true && deleteWhenNotInReset;

    if (fullReset)
        await indexedDB.deleteDatabase(dbName);

    let version =
        fullReset ? 1 
        : reset ? await getDbVersion(dbName) + 1
        : undefined;

    return new Promise((res,rej) => {
        let dbOpenRequest = indexedDB.open(dbName, version);
        dbOpenRequest.onsuccess = event => res(event.target.result);
        dbOpenRequest.onupgradeneeded = 
            event => upgrade(event.target.result, reset, deleteWhenNotInReset);
    });

}

async function getDbVersion(dbName) {
    return new Promise((res,rej) => {
        let dbOpenRequest = indexedDB.open(dbName);
        dbOpenRequest.onsuccess = event => {
            let db = event.target.result;
            let v = db.version;
            db.close();
            res(v);
        };
    });
}

async function upgrade (db, reset, deleteWhenNotInReset) { 

    let isObject = typeof reset === 'object' && Object.keys(reset).length > 0;

    let datasets = 
        reset === true ? sample
        : isObject ? reset
        : typeof reset === 'string' ? { [reset]: sample[reset] }
        : Array.isArray(reset) ? reset.reduce((a,b) => Object.assign(a, {[b.key]: b.data}), {})
        : null;
        
    let keyPaths = 
        reset === true ? Object.keys(sample).map(key => ({ [key]: 'id' }))
        : isObject ? Object.keys(datasets).reduce((a,b) => Object.assign(a, {[b.key]: 'id' }), {})
        : typeof reset === 'string' ? { [reset]: { [key]: 'id' } }
        : Array.isArray(reset) ? reset.reduce((a,b) => Object.assign(a, {[b.key]: b.keyPath}), {})
        : null;

    let deleteKeys = 
        deleteWhenNotInReset 
        ? [...db.objectStoreNames]
        : Object.keys(datasets);
        
    for (let key of deleteKeys) { 
        if ([...db.objectStoreNames].indexOf(key) == -1)
            continue;
        console.log(`deleting ${key}`);
        await db.deleteObjectStore(key);
    }

    for (let key of Object.keys(datasets)) { 

        console.log(`creating ${key}`);

        // if the first row of the store contains the expected key, 
        // then no autoincrement, otherwise yes.
        let store = await db.createObjectStore(key, {
            keyPath: keyPaths[key],
            autoIncrement: datasets[key].length > 0 && !Object.keys(datasets[key][0]).includes(keyPaths[key])
        });

        for (let row of datasets[key]) 
            store.put(row);

    }

}


/*
import * as idb from 'idb';
import sample from './sampleData.client.js';

// TODO: try to create better reset behavior that matches
// what now exists in sampleData.mongo.js.  Then make sure
// it doesn't break runTests.js.  Then write tests for 
// FluentDB.mergeExternal() on IDB and Mongo as targets.
export default async function (dbName, reset, keyPaths) { 

    if (reset)
        await indexedDB.deleteDatabase(dbName);

    return idb.open(dbName, 1, async db => { 

        let data = Object.keys(reset).length > 0 ? reset : sample;
        keyPaths = keyPaths || Object.keys(data).map(key => ({ [key]: 'id' }));

        for (let name of db.objectStoreNames) 
            await db.deleteObjectStore(name);

        for (let key of Object.keys(data)) { 

            // if the first row of the store contains the expected key, 
            // then no autoincrement, otherwise yes.
            let store = await db.createObjectStore(key, {
                keyPath: keyPaths[key],
                autoIncrement: data[key].length > 0 && !Object.keys(data[key][0]).includes(keyPaths[key])
            });

            for (let row of data[key]) 
                store.put(row);

        }

        return db

    });

}

*/

export default sampleData_idb;
