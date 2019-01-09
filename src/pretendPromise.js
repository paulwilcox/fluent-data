
export let pretendPromise = class {

    constructor(input) {
        this.workingObject = input;
        this.funcs = [];
        this.funcStrings = [];
    }

    then (func) {
        this.funcs.push(func);
        this.funcStrings.push(func.toString());
        return this;
    }

    execute() {

        let asPromise = Promise.resolve(this.workingObject);
        let isPromise = asPromise == this.workingObject;

        for (let func of this.funcs) {

            this.workingObject = 
                  isPromise
                ? this.workingObject.then(func)
                : func(this.workingObject);

        }

        return this.workingObject;

    }

}

// A different use of the word 'resolve'.  I used to 
// think it was more like an 'execute'.  So the 
// terminology may be off in other areas of this 
// library.
pretendPromise.resolve = arrayOrPretendPromise => 
      arrayOrPretendPromise instanceof pretendPromise 
    ? arrayOrPretendPromise 
    : new pretendPromise(arrayOrPretendPromise);

pretendPromise.all = maybePromises => {

    let unBoxeds = [];
    let hasRealPromise = false;

    for(let maybePromise of maybePromises) {

        let unBoxed =
            maybePromise instanceof pretendPromise
            ? maybePromise.execute()
            : maybePromise;

        if (Promise.resolve(unBoxed) == unBoxed)
            hasRealPromise = true;

        unBoxeds.push(unBoxed);

    }

    return hasRealPromise
        ? Promise.all(unBoxeds)
        : new pretendPromise(unBoxeds);

}

/*
// Note that if there is a real Promise in the input, then
// a real Promise is returned, not a PretendPromise.
// fixme: calling pretendPromise.all might be passing the
// working objects without passing the functions.  Maybe
// I need to execute the working objects before pushing
// them to 'unBoxeds'?  
pretendPromise.all = arrayOfMaybePretendPromises => {

    let unBoxeds = [];
    let hasRealPromise = false;

    for(let maybeTishable of arrayOfMaybePretendPromises) {

        let unBoxed =
                maybeTishable instanceof pretendPromise
            ? maybeTishable.workingObject
            : maybeTishable;

        if (Promise.resolve(unBoxed) == unBoxed)
            hasRealPromise = true;

        unBoxeds.push(unBoxed);

    }

    return hasRealPromise
        ? Promise.all(unBoxeds)
        : new pretendPromise(unBoxeds);

}
*/