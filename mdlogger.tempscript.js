    let $$ = require('./dist/FluentDB.server.js');
    
    let purchases = [
        { customer: 'Alice', speed: 5, rating: 5 },
        { customer: 'Benny', speed: 10, rating: 25 },
        { customer: 'Cathy', speed: 15, rating: 75 }
    ];;    var calibrations = 
        $$(purchases).map(p => ({
            ...p, 
            recalibrated: p.speed - 10
        }));

    console.log('Calibrations 1:', calibrations.get(), `\r\n`);

    purchases.push({ customer: 'David', speed: 20, rating: 1 });

    console.log('Calibrations 2:', calibrations.get());