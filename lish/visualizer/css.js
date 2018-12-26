
// Christoph at https://stackoverflow.com/questions/
//   524696/how-to-create-a-style-tag-with-javascript
export function addDefaultCss () {

    if (hasLishCssRule())
        return;

    let style = document.createElement('style');
    style.type = 'text/css';

    style.appendChild(document.createTextNode(defaultCss));
    document.head.appendChild(style);

}

let hasLishCssRule = () => {

    for(let sheet of document.styleSheets)
    for(let rule of sheet.rules)
    if(rule.selectorText.substring(0,5) == ".lish")
        return true;

    return false; 

}

let defaultCss = `

    .lishString {
        color: #FF9900;
    }

    .lishNumber {
        color: #0088cc;
    }

    .lishNullish {
        color: gainsboro;
        font-style: italic;
    }

    .lishFunc {
        color: BB5500;
        font-family: monospace;
    }

    .lishTable {
        border: 2px solid #0088CC;
        border-collapse: collapse;
        margin:5px;
    }

    .lishTable caption {
        border: 1px solid #0088CC;
        background-color: #0088CC;
        color: white;
        font-weight: bold;
        padding: 3px;
    }

    .lishTable th {
        background-color: gainsboro;
        border: 1px solid #C8C8C8;
        padding: 3px;
    }

    .lishTable td {
        border: 1px solid #C8C8C8;
        text-align: center;
        vertical-align: middle;
        padding: 3px;
    }

    .lishTable tFoot {
        background-color: whitesmoke;
        font-style: italic;
        color: teal;
    }

    .lishTable tFoot a {
        text-decoration: none;
        color: teal;
    }

    .lishTable tFoot a.active {
        text-decoration: underline;
    }

    .lishPageDiv {
        text-align: left;
        vertical-align: middle;
        font-size: smaller;
    }

    .lishPageInputDiv * {
        display: inline-block;
    }

    .lishPageInput {
        padding: 1px 3px;
        background-color: white;
        border: solid 1px blue;
        color: black;
        font-style: normal;
        min-width: 15px;
    }

    .lishPageInputSubmit {
        height: 10px;
        width: 10px;
        margin: 0;
        padding: 0;
    }

`;