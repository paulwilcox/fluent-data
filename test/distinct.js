
async function test () {

    let numbers =  [
        { id: 0, label: 'zero' },
        { id: 1, label: 'one' },
        { id: 1, label: '??' },
        { id: 2, label: '??' },
        { id: 2, label: '??' }  
    ];

    let results = 
        $$({ n: numbers })
        .distinct(n => n.label)
        .get(n => n);

    if (results.filter(n => n == '??').length != 1) {
        return false;
    }

    results = 
        $$({ n: numbers })
        .distinct(n => n)
        .get(n => n);

    if (results.filter(n => n.id == 2).length != 1)
        return false;

    return true;

}