
export let thenRemoveUndefinedKeys = mapper =>

    (...args) => {
        let result = mapper(...args);
        return removeUndefinedKeys(result);
    };

export let removeUndefinedKeys = obj => {
    
    for(let key of Object.keys(obj))
        if (obj[key] === undefined) 
            delete result[key];

    return obj;

}
