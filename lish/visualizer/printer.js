import {pretendPromise} from "../pretendPromise.js";
import {addPagerToTables} from "../visualizer/pager.js";
import {addDefaultCss} from "../visualizer/css.js";

export function print(target, obj, caption) {

    let isPromisy = obj instanceof pretendPromise || Promise.resolve(obj) == obj;

    if (isPromisy) {
        console.trace();
        throw(
            "Can't print object.  It is a promise.  " + 
            "Print from inside 'then' function instead."
        );
    }
        
    document.querySelector(target).innerHTML +=
        //(document.querySelector(target).innerHTML.trim() == "" ? "" : "<br/>") +
        makeHtml(obj, caption);

    let maybeTables = 
        document.querySelector(target)
        .querySelectorAll('.lishTable');

    if (maybeTables.length > 0)
        addPagerToTables(maybeTables);

    addDefaultCss();

}

function makeHtml(obj, caption) {

    let printType = getPrintType(obj);

    return printType == 'arrayOfObjects' ? arrayOfObjectsToTable(obj, caption)
        : printType == 'array' ? arrayToTable(obj, caption)
        : printType == 'string' ? stringToHtml(obj)
        : printType == 'number' ? `<span class='lishNumber'>${obj}</span>`
        : printType == 'nullish' ? `<span class='lishNullish'>${obj}</span>`
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
        : (obj == null || typeof obj == 'undefined') ? 'nullish'
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
        <span class='lishString'>
            ${ htmlEncode(str) }
        </span>
    `;
}

function functionToHtml (func) {
    return `
        <span class='lishFunc'>
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

    return `<table class='lishTable'>${html}</table>`;

}

function arrayToTable (items, caption) {
    
    let html = ``;

    for(let item of items) 
        html += `<tr><td>${makeHtml(item)}</td></tr>`;

    return `
        <table class='lishTable'>
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
        <table class='lishTable'>
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
