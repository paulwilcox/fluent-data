import {print} from "../src/visualizer/printer.js";
import {addPagerToTables} from "../src/visualizer/pager.js";
    
document.body.innerHTML += `        
    <p>Use of visualizer directly:</p>
    <div id='result'></div><br/>
    <div id='result2'></div><br/>
    <div id='result3'></div><br/>
    <div id='result4'></div><br/>
    <div id='result5'></div><br/>
`;

let sample1 = [
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
];

let sample2 = [1,2,3,4,5,6,7];
let sample3 = { 
    a: "eigh", 
    b: 1, 
    c: 0.555,
    d: "delta",
    e: "pentagon",
    f: "fourier",
    g: "gauss"
};

let sample4 = (x,y) => { 
    if (x.a < x.b && x.a > x.c) 
        return (x.a + x.b) / 2 + x.c; 
};

let sample5 = true;

print('#result', sample1, "Sample Structure");
print('#result2', sample2);
print('#result3', sample3);
print('#result4', sample4);
print('#result5', sample5);

function test () { return true; }