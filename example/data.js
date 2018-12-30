import "../node_modules/idb/lib/idb.js";
    
//window.indexedDB.deleteDatabase('sample');

export let sampleIdb = 
    idb.open(
        'sample', 
        1, 
        udb => { 
                            
            switch (udb.oldVersion) {
                case 0: 
                    udb.createObjectStore('products', {keyPath: 'id'});
                    udb.createObjectStore('customers', {keyPath: 'id'});
                    udb.createObjectStore('orders', {keyPath: 'id'});
                    udb.createObjectStore('students', {keyPath: 'id'});
                    udb.createObjectStore('foods', {keyPath: 'id'});
            }
        
        }
    )
    .then(db => {

        put(db, 'products', [
            { id: 123456, price: 5 },
            { id: 123457, price: 2 },
            { id: 123458, price: 1.5 },
            { id: 123459, price: 4 }
        ]);               

        put(db, 'customers', [
            { id: 1, fullname: "Jane Doe" },
            { id: 2, fullname: "John Doe" }
        ]);                

        put(db, 'orders', [
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
        ]);    

        put(db, 'students', [
            { id: "a", name: "Andrea" },
            { id: "b", name: "Becky" },
            { id: "c", name: "Colin" }
        ]);

        put(db, 'foods', [
            'clear',
            { id: 1, name: 'tacos' },
            { id: 2, name: 'skittles' },
            { id: 3, name: 'flan' }
        ]);

        return db;

    });

export let scores = [
    {id: 1, student: "a", score: 5 },
    {id: 2, student: "b", score: 7 },
    {id: 3, student: "c", score: 10 },
    {id: 4, student: "a", score: 0 },
    {id: 5, student: "b", score: 6 },
    {id: 6, student: "c", score: 9 }
];

export let students = [
    {id: "a", name: "andrea"},
    {id: "b", name: "becky"},
    {id: "c", name: "colin"}
];

export let customers = [
    { id: 1, fullname: "Janet Doe" },
    { id: 2, fullname: "Johnathan Doe" }
];

function put (db, storeName, rows) {

    let store = 
        db
        .transaction(storeName, "readwrite")
        .objectStore(storeName);     
    
    for (let row of rows) 
        if (row === 'clear')
            store.clear();
        else 
            store.put(row);

};
