import {print} from "../src/visualizer/printer.js";

let samples = [

    [1,2,3,4,5,6,7,8,9,10,11,12],
    [1,2,3,4,5,6,7,8,9,10,11,12],

    [
        { m: "em", n: "en", o: "oh" },
        { m: "m", n: "n", o: "o", p: "p" },
        { m: "mont", n: "nev", o: "ore", p: "pens" },
        [
            1,2,3,4,5,6,7,8,9,
            'this is the tenth item in the list and its too large',
            11,12,13,14,15,16,17,18,19,20
        ],
        { m: "mu", n: "nu", o: "omicron", p: "pi" },
        { m: "moises", n: "nancy", o: "oliver", p: "patricia" }
    ],

    [1,2,3,4,5,6,7],

    { 
        a: "eigh", 
        b: 1, 
        c: 0.555,
        d: "delta",
        e: "pentagon",
        f: "fourier",
        g: "gauss"
    },

    (x,y) => { 
        if (x.a < y.a && x.a > y.b) 
            return (x.a + y.a) / 2 + x.b - y.b; 
    },

    true

];

for(let s in samples) {
    document.body.innerHTML += `<div id='result${s}'></div><br/>`
    print(`#result${s}`, samples[s]);
}

function test () { 
    
    return true; 

}