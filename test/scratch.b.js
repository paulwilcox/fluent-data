let orders = [
    { "id": 901, "customer": 1, "product": 123456, "speed": 1, "rating": 2 },
    { "id": 902, "customer": 1, "product": 123457, "speed": 2, "rating": 7 },
    { "id": 903, "customer": 2, "product": 123456, "speed": 3, "rating": 43 },
    { "id": 904, "customer": 2, "product": 123457, "speed": 4, "rating": 52 },
    { "id": 905, "customer": 1, "product": 123459, "speed": 5, "rating": 93 },
    { "id": 906, "customer": 1, "product": 123459, "speed": 6, "rating": 74 },
    { "id": 907, "customer": 2, "product": 123458, "speed": 7, "rating": 3 },
    { "id": 908, "customer": 2, "product": 123458, "speed": 8, "rating": 80 },
    { "id": 909, "customer": 1, "product": 123459, "speed": 7, "rating": 23 },
    { "id": 910, "customer": 1, "product": 123459, "speed": 8, "rating": 205 },
    { "id": 911, "customer": 1, "product": 123459, "speed": 3, "rating": 4 },
    { "id": 912, "customer": 7, "product": 123457, "speed": 2, "rating": 6 } 
];

async function test() {

    let results = 
        $$(orders)
        .reduce({
            firstCustomer: $$.first(o => o.customer), 
            speed: $$.avg(o => o.speed),
            rating: $$.avg(o => o.rating),
            speed_cor: $$.cor(o => [o.speed, o.rating]),
            n: $$.count(o => o.id)
        })
        .get();

    console.log(results);

/*

    let multiline = `this is more\r\nthan one line`;

    let data = [
        { customerId: 'b', books: 4, ml: multiline, sound: 'bee' },
        { customerId: 'a', books: 1, ml: multiline, sound: 'eigh' },
        { customerId: 'a', books: 5, ml: multiline, sound: 'eigh' },
        { customerId: 'b', books: 2, ml: multiline, sound: 'bee' }
    ];

    document.body.innerHTML += `<div id='printer' style='font-family:consolas'></div>`;

    let results = $$(data)
        .group(row => row.customerId)
        //.map(row => ({...row, books2: -row.books}))
        //.ungroup()
        //.map(row => ({...row, flag: row.books >= 3 }))
        .group(row => [row.customerId, row.sound])
        .ungroup()
        .get();
*/

}




