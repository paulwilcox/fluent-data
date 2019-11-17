let fs = require('fs');

let contents = fs.readFileSync('.\\wiki\\Home.md').toString();
let url = 'https://github.com/paulwilcox/FluentDB/wiki';

// finds '](' in '... [text](link) ...' provided that 
// 'link' does not begin with 'http:' or 'https:'
let pattern = /(?<=\[.+)\]\((?=.+\))(?!http[s]*:)/g; 

contents = contents.replace(pattern, `](${url}/`);
fs.writeFileSync('.\\readMe.md', contents);
console.log('Done transfering home.md to readMe.md');


