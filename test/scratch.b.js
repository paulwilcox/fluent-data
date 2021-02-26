async function test () {
    
    let mx = new $$.matrix([
        [1, 2, 3, 4],
        [5, 6, 7, 8]
    ]);

    let mx2 = new $$.matrix([
        [1, 2, 3, 4],
        [5, 6, 7, 8.01]
    ]).setRowNames(['run','amok']);

    console.log(equals(mx,mx2,0,true));
    console.log(equals(mx,mx2,0,false));

    console.log('\n');
    console.log(mx.equals(mx2,0,true));
    console.log(mx.equals(mx2,0,false));
    

}

function equals(_this, other, errorThreshold = 0, dataOnly = true) {

    let arrayEq = (a,b,isString) => {
        if (a.length != b.length)
            return false;
        for(let i in a)
            if (!isString && Math.abs(a[i] - b[i]) > errorThreshold)
                return false;
            else if (isString && a != b)
                return false;
        return true;
    }

    if (_this.data.length != other.data.length)
        return false;
    if (_this.data.length != 0 && _this.data[0].length != other.data[0].length)
        return false;

    for (let r in _this.data)
        if (!arrayEq(_this.data[r], other.data[r], false))
            return false;

    return dataOnly ? true
        : !arrayEq(_this.rowNames, other.rowNames, true) ? false 
        : !arrayEq(_this.colNames, other.colNames, true) ? false
        : true;

}