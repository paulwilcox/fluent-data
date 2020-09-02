let arrayFunc = d => [d.cases, d.distance(), 13, x => [a, b]];

let match = 
    arrayFunc.toString()
    .match(/(?<=\[).+(?=\])/);
    
if (match.length == 0)
    return;
    
let result = 
    match[0]
    .split(',')
    .map(entry => {
        let parts = entry.split('.');
        let last = parts[parts.length - 1].trim();
        last = last.replace(/[^0-9A-z_$]/g, '');
        return last;
    });

console.log(result)