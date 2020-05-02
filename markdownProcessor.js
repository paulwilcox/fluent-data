let fs = require('fs');
let util = require('util');
let cp = require('child_process');
let = exec = util.promisify(cp.exec);

(async function main() {

    let lines = fs.readFileSync('./wiki/test.md')
    .toString()
    .split('\r\n');

    let groups = groupLines(lines);
    groups = processOutputs(groups);

    

}())

async function processOutputs (groups) {

    let output = '';

    for(var group of groups) 
        if (group.type == 'code' && group.frameArgs.output != 'true') {
            if (output != '')
                output += '\r\n';
            output += await captureOutput(group.value);
        }
        else if (group.type == 'code' && group.frameArgs.output == 'true') {
            group.value = output; 
            output = '';
        }

    return groups;

};

function groupLines (lines) {

    let groups = [];
    let group = { 
        type: 'md', 
        value: ''
    };

    for(let line of lines) {

        let isFrame = line.trim().startsWith('```')

        if (group.type == 'md' && isFrame) {
            groups.push(group);
            group = {
                type: 'code',
                frameStarter: line,
                frameArgs: parseFrameArgs(line),
                value: '' 
            }
        }
        else if (group.type == 'code' && line.trim().endsWith('```')) 
            group.frameEnder = line;
        else if (group.type == 'code' && group.frameEnder) {
            groups.push(group);
            group = {
                type: 'md',
                value: line 
            }
        } 
        else 
            group.value += 
                (group.value == '' ? '' : `\r\n`) + 
                line;

    }

    groups.push(group);

    return groups;
    
}

function parseFrameArgs (str) {
    let match = str.match(/(?<=\{).+(?=\})/mg);
    if (match == null) 
        return null;
    return match[0]
        .split(',')
        .map(s => s.split('='))
        .reduce((obj,sp) => {
            obj[sp[0].trim()] = sp[1].trim();
            return obj;
        }, {});
}

async function captureOutput(script) {
    
    let output = '';
    script = script.replace(/\r\n/gm, ';');    

    await exec(`node -e "${script}"`)
        .then(log => {
            output += log.stdout + log.stderr;
        })
        .catch(error => {
            console.log('exec error: ' + error);
        });

    return output;

}

