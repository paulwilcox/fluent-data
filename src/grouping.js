export default class extends Array {

    constructor(key, level, ...elements) {
        this.key = key;
        this.level = level;
        super(...elements);
    }


    * recurse (func) {

        if (levelCountdown === 0)
            return func([this])[0];
    
        if (levelCountdown > 1) { // data is nested groups
            for (let item of data) 
                yield recurse(func, item, levelCountdown - 1);
            return;
        }
    
        yield* func(data); // data is base records
    
    }
    /*
    function recurseToArray (func, data, levelCountdown) {
    
        if (levelCountdown === 0)
            return func([data])[0];
    
        let list = [];
    
        for(let item of data)
            list.push(
                levelCountdown > 1          
                ? recurseToArray(func, item, levelCountdown - 1)
                : g.noUndefined(func(item))
            );
    
        if (data.key) 
            list.key = data.key;
        
        return list;    
    
    }
    */

}