
async function test() {

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
        .map(row => ({...row, books2: -row.books}))
        .ungroup()
        .map(row => ({...row, flag: row.books >= 3 }))
        .group(row => [row.customerId, row.sound])
        .get();

    console.log(results);

}




