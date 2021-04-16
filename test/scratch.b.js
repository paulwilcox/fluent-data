
async function test() {

    let multiline = `this is more\r\nthan one line`;

    let data = [
        { customerId: 'b', books: 4, ml: multiline },
        { customerId: 'a', books: 1, ml: multiline },
        { customerId: 'a', books: 5, ml: multiline },
        { customerId: 'b', books: 2, ml: multiline }
    ];

    document.body.innerHTML += `<div id='printer' style='font-family:consolas'></div>`;

    let results = $$(data)
        .group(row => row.customerId)
        .map(row => ({...row, books2: -row.books}))
        .get();

    console.log(results);

}




