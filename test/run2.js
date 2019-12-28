let fs = require('fs');

let contents = fs.readFileSync('test/filterTest.js', 'utf8');
let testName = 'filterTest';

let result;
try {result = eval(contents)}
catch {result = false;}



let isClientOnly = contents.includes('sampleIdb.');
let isServerOnly = contents.includes('sampleMongo');

console.log({contents})