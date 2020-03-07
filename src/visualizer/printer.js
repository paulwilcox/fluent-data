import printerCss from './printer.css.js';
import { addPagerToTables, addAnchorClickEvents } from './pager.js';

export function print(target, obj, caption) {

    addDefaultCss();
    addAnchorClickEvents();

    document.querySelector(target).innerHTML +=
        makeHtml(obj, caption);

    let maybeTables = 
        document.querySelector(target)
        .querySelectorAll('.oneQueryTable');

    if (maybeTables.length > 0)
        addPagerToTables(maybeTables);        

}

function makeHtml(obj, caption) {

    let printType = getPrintType(obj);

    return printType == 'arrayOfObjects' ? arrayOfObjectsToTable(obj, caption)
        : printType == 'array' ? arrayToTable(obj, caption)
        : printType == 'string' ? stringToHtml(obj)
        : printType == 'number' ? `<span class='oneQueryNumber'>${obj}</span>`
        : printType == 'nuloneQuery' ? `<span class='oneQueryNuloneQuery'>${obj}</span>`
        : printType == 'function' ? functionToHtml(obj)
        : printType == 'object' ? objectToTable(obj)
        : `${obj}`;

}

function getPrintType (obj) {

    let isArray = Array.isArray(obj);        
    let isArrayOfObjects = false;

    if (isArray) {
        let len = obj.length;
        let keyCounts = Object.values(getArrayKeys(obj));
        let highlyUsedKeys = keyCounts.filter(kc => kc >= len * 0.75).length;
        isArrayOfObjects = 
            highlyUsedKeys >= keyCounts.length * 0.75 // highly structured;
            && keyCounts.length > 0; 
    }

    return isArrayOfObjects ? 'arrayOfObjects'
        : isArray ? 'array'
        : (obj == null || typeof obj == 'undefined') ? 'nuloneQuery'
        : typeof obj;

}

function getArrayKeys (array) {

    let keys = {};

    for(let item of array) 
    if (getPrintType(item) == 'object')
    for(let key of Object.keys(item))
        if(keys[key])
            keys[key] += 1;
        else 
            keys[key] = 1;

    return keys;

}

function stringToHtml (str) {
    return `
        <span class='oneQueryString'>
            ${ htmlEncode(str) }
        </span>
    `;
}

function functionToHtml (func) {
    return `
        <span class='oneQueryFunc'>
            ${ htmlEncode(func.toString()) }
        </span>
    `;
}

function objectToTable (obj) {
    
    let html = ``;

    for (let entry of Object.entries(obj))
        html += `
        <tr>
            <th>${entry[0]}</th>
            <td>${makeHtml(entry[1])}</td>
        </tr>
        `;

    return `<table class='oneQueryTable'>${html}</table>`;

}

function arrayToTable (items, caption) {
    
    let html = ``;

    for(let item of items) 
        html += `<tr><td>${makeHtml(item)}</td></tr>`;

    return `
        <table class='oneQueryTable'>
            ${caption != null ? `<caption>${caption}</caption>` : ''}
            ${html}
        </table>`;

}

function arrayOfObjectsToTable (objects, caption) {

    let keys = Object.keys(getArrayKeys(objects));
    let reformeds = [];
    
    let header = `<tr>`
    for(let key of keys)
        header += `<th>${key}</th>`;
    header += `</tr>`;

    let body = ``;

    for(let obj of objects) {
        body += `<tr>`;
        if (getPrintType(obj) == 'object')
            for (let key of keys) 
                body += `<td>${makeHtml(obj[key])}</td>`;
        else 
            body += `<td colspan=${keys.length}>${makeHtml(obj)}</td>`;
        body += `</tr>`;
    }

    return `
        <table class='oneQueryTable'>
            ${caption != null ? `<caption>${caption}</caption>` : ''}
            <tHead>${header}</tHead>
            <tBody>${body}</tBody>
        </table>
    `;

}

function htmlEncode (str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\t/g, '&emsp;')
        .replace(/  /g, '&emsp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');
}

function addDefaultCss () {

    if (hasoneQueryCssRule())
        return;

    let style = document.createElement('style');
    style.type = 'text/css';

    style.appendChild(document.createTextNode(printerCss));
    document.head.appendChild(style);

}

function hasoneQueryCssRule () {

    for(let sheet of document.styleSheets)
    for(let rule of sheet.rules)
        if(rule.selectorText.substring(0,5) == ".oneQuery")
            return true;

    return false; 

}