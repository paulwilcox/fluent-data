
export let thenRemoveUndefinedKeys = mapper =>

    (...args) => {

        let result = mapper(...args);
        
        for(let key of Object.keys(result))
            if (result[key] === undefined) 
                delete result[key];
        
        return result;

    };
