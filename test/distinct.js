
async function test () {

    let numbers =  [
        { id: 0, label: 'zero' },
        { id: 1, label: 'one' },
        { id: 1, label: '??' },
        { id: 2, label: '??' },
        { id: 2, label: '??' }  
    ];

    let results = 
        $$(numbers)
        .distinct(n => n.label)
        .get();

    if (results.filter(n => n.label == '??').length != 1) {
        return false;
    }

    results = 
        $$(numbers)
        .distinct()
        .get();

    if (results.filter(n => n.id == 2).length != 1)
        return false;

    return true;

}