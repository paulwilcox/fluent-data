
async function test () {

    let mx = new $$.matrix([
        { marker: 'Applewood Park', x: 0, y: 0 },
        { marker: 'Orangewood School', x: 10, y: 0},
        { marker: `The Millers`, x: -5, y: 0 },
        { marker: 'The Romeros', x: 0, y: -5 },
        { marker: 'The Lees', x: 5, y: 5 },
        { marker: 'The Lees', x: 5, y: 0 },
        { marker: 'The Lebedevs', x: 15, y: 5 }
    ], 'x, x', 'marker').log();

}
