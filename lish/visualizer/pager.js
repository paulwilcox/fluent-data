
/*
    jsFiddle paging:

    anushree
   - https://stackoverflow.com/questions/19605078/
        how-to-use-pagination-on-html-tables
   - https://jsfiddle.net/u9d1ewsh
*/

export function addPagerToTables(
    tables, 
    rowsPerPage = 10, 
    aTagMax = 10,
    pageInputThreshold = null
) {

    tables = 
        typeof tables == "string"
        ? document.querySelectorAll(tables)
        : tables;

    for (let table of Array.from(tables)) 
        addPagerToTable(table, rowsPerPage, aTagMax, pageInputThreshold);
    
}

export function addPagerToTable(
    table, 
    rowsPerPage = 10, 
    aTagMax = 10,
    pageInputThreshold = null
) {

    let tBodyRows = table.querySelectorAll(':scope > tBody > tr');
    let numPages = Math.ceil(tBodyRows.length/rowsPerPage);
    
    if (pageInputThreshold == null) 
        pageInputThreshold = aTagMax;

    if(numPages == 1)
        return;

    let colCount = 
        Array.from(
            table.querySelector('tr').cells
        )
        .reduce((a,b) => a + parseInt(b.colSpan), 0);

    table
    .createTFoot()
    .insertRow()
    .innerHTML = `
        <td colspan=${colCount}>
            <div class="lishPageDiv"></div>
        </td>
    `;

    let pageDiv = table.querySelector('.lishPageDiv');
    insertPageLinks(pageDiv, numPages);
    insertPageInput(pageDiv, numPages, pageInputThreshold);
    addPageInputListeners(table);

    changeToPage(table, 1, rowsPerPage, numPages, aTagMax);

    for (let pageA of table.querySelectorAll('.lishPageDiv a'))
        pageA.addEventListener(
            'click', 
            e => {

                let cPage = currentPage(table);
                let hasLt = e.target.innerHTML.substring(0,3) == '&lt';
                let hasGt = e.target.innerHTML.substring(0,3) == '&gt';
                let rel = e.target.rel;

                let toPage = 
                    (hasLt && cPage == 1) ? numPages
                    : (hasGt && cPage == numPages) ? 1
                    : (hasLt && rel < 0) ? cPage - 1
                    : (hasGt && rel < 0) ? cPage + 1
                    : parseInt(rel) + 1;

                changeToPage(
                    table, 
                    toPage,  
                    rowsPerPage,
                    numPages,
                    aTagMax
                );

            }
        );

}

function insertPageLinks(pageDiv, numPages, aTagMax) {

    let insertA = (rel,innerHtml) =>
        pageDiv
        .insertAdjacentHTML(
            'beforeend',
            `<a href='#' rel="${rel}">${innerHtml}</a> ` 
        );

    insertA(0,'<');
    insertA(-1,'<');

    for(let page = 1; page <= numPages; page++) 
        insertA(page - 1,page);

    insertA(-1,'>');
    insertA(numPages - 1,'>');

}

function insertPageInput(pageDiv, numPages, pageInputThreshold) {

    if (numPages < pageInputThreshold)
        return;

    pageDiv
    .insertAdjacentHTML(
        'beforeend',
        `
            <br/>
            <div class='lishPageInputDiv' style='display:none;'>
                <div contenteditable='true' class='lishPageInput'>1</div>
                <button class='lishPageInputSubmit'></button>
            </div>
            <label class='lishPageRatio'>${numPages} pages</label>
        `
    );

}

function showInputDiv (tbl, show) {
    if (!tbl.tFoot.querySelector('.lishPageInputDiv'))
        return;
    tbl.tFoot.querySelector('.lishPageInputDiv').style.display = show ? 'inline-block' : 'none';
    tbl.tFoot.querySelector('.lishPageRatio').style.display = show ? 'none' : 'inline-block';
}

function addPageInputListeners (table) {

    if (!table.tFoot.querySelector('.lishPageInputDiv'))
        return;

    let listen = (selector, event, callback) => 
        table.querySelector(selector)
        .addEventListener(event, callback); 

    table
    .addEventListener(
        'mouseleave',
        e => {
            showInputDiv(e.target, false);
            table.querySelector('.lishPageInput').innerHTML = "";
        }
    );

    listen(
        '.lishPageRatio',
        'mouseenter',
        e => showInputDiv(table, true)
    );

    listen(
        '.lishPageRatio', 
        'click',
        e => showInputDiv(table, true)
    );

    listen(
        '.lishPageInput',
        'mouseenter',
        e => table.querySelector('.lishPageInput').innerHTML = ""
    );

    listen(
        '.lishPageInputSubmit',
        'click',
        e => {

            let pInput = table.querySelector('.lishPageInput');
            let desiredPage = parseInt(pInput.innerHTML);

            if (isNaN(desiredPage)) {
                pInput.innerHTML = "";
                return;
            }

            changeToPage(
                table,
                desiredPage,
                rowsPerPage,
                numPages,
                pageButtonDeviation
            );

        }

    );    

}

function changeToPage(
    table, 
    page, 
    rowsPerPage, 
    numPages, 
    aTagMax
) {

    let startItem = (page - 1) * rowsPerPage;
    let endItem = startItem + rowsPerPage;
    let pageAs = table.querySelectorAll('.lishPageDiv a');
    let tBodyRows = [...table.tBodies].reduce((a,b) => a.concat(b)).rows;

    for (let pix = 0; pix < pageAs.length; pix++) {

        let a = pageAs[pix];
        let aText = pageAs[pix].innerHTML;
        let aPage = parseInt(aText);

        if (page == aPage)
            a.classList.add('active');
        else 
            a.classList.remove('active');

        a.style.display =
            (
                    aPage > page - Math.ceil(aTagMax / 2.0) 
                && aPage < page + Math.ceil(aTagMax / 2.0)
            )
            || isNaN(aPage) 
            ? 'inline-block'
            : 'none';

        for (let trix = 0; trix < tBodyRows.length; trix++) 
            tBodyRows[trix].style.display = 
                (trix >= startItem && trix < endItem)
                ? 'table-row'
                : 'none';  

    }

}

function currentPage (table) {
    return parseInt(
        table.querySelector('.lishPageDiv a.active').innerHTML
    );
}