    let $$ = require('./dist/FluentDB.server.js');
    
    let customers = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Benny' },
        { id: 3, name: 'Cathy' }
    ];;    let json = `{
        "data":[
            {"id":1,"name":"Alice","initial":"A"},
            {"id":2,"name":"Benny","initial":"B"},
            {"id":3,"name":"Cathy","initial":"C"}
        ],
        "groupLevel":1
    }`;

    let results = 
        $$.fromJson(json)
        .filter(c => c.initial != 'C')
        .get();

    console.log(results);