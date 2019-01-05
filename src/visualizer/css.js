
// Christoph at https://stackoverflow.com/questions/
//   524696/how-to-create-a-style-tag-with-javascript
export function addDefaultCss () {

    if (hasoneQueryCssRule())
        return;

    let style = document.createElement('style');
    style.type = 'text/css';

    style.appendChild(document.createTextNode(defaultCss));
    document.head.appendChild(style);

}

let hasoneQueryCssRule = () => {

    for(let sheet of document.styleSheets)
    for(let rule of sheet.rules)
    if(rule.selectorText.substring(0,5) == ".oneQuery")
        return true;

    return false; 

}

let defaultCss = `

    .oneQueryString {
        color: #FF9900;
    }

    .oneQueryNumber {
        color: #0088cc;
    }

    .oneQueryNuloneQuery {
        color: gainsboro;
        font-style: italic;
    }

    .oneQueryFunc {
        color: BB5500;
        font-family: monospace;
    }

    .oneQueryTable {
        border: 2px solid #0088CC;
        border-collapse: collapse;
        margin:5px;
    }

    .oneQueryTable caption {
        border: 1px solid #0088CC;
        background-color: #0088CC;
        color: white;
        font-weight: bold;
        padding: 3px;
    }

    .oneQueryTable th {
        background-color: gainsboro;
        border: 1px solid #C8C8C8;
        padding: 3px;
    }

    .oneQueryTable td {
        border: 1px solid #C8C8C8;
        text-align: center;
        vertical-align: middle;
        padding: 3px;
    }

    .oneQueryTable tFoot {
        background-color: whitesmoke;
        font-style: italic;
        color: teal;
    }

    .oneQueryTable tFoot a {
        text-decoration: none;
        color: teal;
    }

    .oneQueryTable tFoot a.active {
        text-decoration: underline;
    }

    .oneQueryPageDiv {
        text-align: left;
        vertical-align: middle;
        font-size: smaller;
    }

    .oneQueryPageInputDiv * {
        display: inline-block;
    }

    .oneQueryPageInput {
        padding: 1px 3px;
        background-color: white;
        border: solid 1px blue;
        color: black;
        font-style: normal;
        min-width: 15px;
    }

    .oneQueryPageInputSubmit {
        height: 10px;
        width: 10px;
        margin: 0;
        padding: 0;
    }

`;