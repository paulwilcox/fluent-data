import "../lish/idb.js";
    
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

        let getSampleStore = storeName => 
            db.transaction(storeName, "readwrite").objectStore(storeName);    

        getSampleStore("products").put({ id: 123456, price: 5 });
        getSampleStore("products").put({ id: 123457, price: 2 });               
        getSampleStore("products").put({ id: 123458, price: 1.5 });               
        getSampleStore("products").put({ id: 123459, price: 4 });               

        getSampleStore("customers").put({ id: 1, fullname: "Jane Doe" });
        getSampleStore("customers").put({ id: 2, fullname: "John Doe" });                

        getSampleStore("orders").put({ id: 901, customer: 1, product: 123456, speed: 1, rating: 2 });
        getSampleStore("orders").put({ id: 902, customer: 1, product: 123457, speed: 2, rating: 7 });                
        getSampleStore("orders").put({ id: 903, customer: 2, product: 123456, speed: 3, rating: 43 });                
        getSampleStore("orders").put({ id: 904, customer: 2, product: 123457, speed: 4, rating: 52 });                
        getSampleStore("orders").put({ id: 905, customer: 1, product: 123459, speed: 5, rating: 93 });                
        getSampleStore("orders").put({ id: 906, customer: 1, product: 123459, speed: 6, rating: 74 });                
        getSampleStore("orders").put({ id: 907, customer: 2, product: 123458, speed: 7, rating: 3 });                
        getSampleStore("orders").put({ id: 908, customer: 2, product: 123458, speed: 8, rating: 80 });                
        getSampleStore("orders").put({ id: 909, customer: 1, product: 123459, speed: 7, rating: 23 });                
        getSampleStore("orders").put({ id: 910, customer: 1, product: 123459, speed: 8, rating: 205 });                
        getSampleStore("orders").put({ id: 911, customer: 1, product: 123459, speed: 3, rating: 4 });                
        getSampleStore("orders").put({ id: 912, customer: 7, product: 123457, speed: 2, rating: 6 }); // notice no customer 7 (use for outer joins)   

        getSampleStore("students").put({ id: "a", name: "Andrea" });
        getSampleStore("students").put({ id: "b", name: "Becky" });
        getSampleStore("students").put({ id: "c", name: "Colin" });

        getSampleStore('foods').clear();
        getSampleStore('foods').put({ id: 1, name: 'tacos' });
        getSampleStore('foods').put({ id: 2, name: 'skittles' });
        getSampleStore('foods').put({ id: 3, name: 'flan' });

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
