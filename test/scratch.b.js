async function test() {

    let multiline = `this is more\r\nthan one line`;

    let data = [
        { customerId: 'b', books: 4, ml: multiline, sound: 'bee' },
        { customerId: 'a', books: 1, ml: multiline, sound: 'eigh' },
        { customerId: 'a', books: 5, ml: multiline, sound: 'eigh' },
        { customerId: 'b', books: 2, ml: multiline, sound: 'bee' }
    ];

    document.body.innerHTML += `<div id='printer' style='font-family:consolas'></div>`;

    let ds = $$(data)
        .distinct(
            row => row.customerId,
            row => [row.customerId, -row.books]
        );

    let contents = ds.log(null, 'data');

    console.log(contents);
    console.log(ds);

}




