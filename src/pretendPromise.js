
export let pretendPromise = class {

    constructor(input) {
        this.workingObject = input;
        this.funcs = [];
    }

    then (func) {
        this.funcs.push(func);
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

pretendPromise.resolve = arrayOrPretendPromise => 
      arrayOrPretendPromise instanceof pretendPromise 
    ? arrayOrPretendPromise 
    : new pretendPromise(arrayOrPretendPromise);

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
    