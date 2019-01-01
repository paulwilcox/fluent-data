// TODO: See if we need to uncomment the falsy checks below.
// I ran orderby without them and surprisingly, it did not 
// fail, though I don't know if the ordering comes out as 
// desired.
//
// orderedValuesSelector accepts a single function that selects 
// values from an object "{}" and returns an array "[]"
export let quicksort = (unsorted, orderedValuesSelector) => {

    if (unsorted.length <= 1) 
        return unsorted;

    let pivot = unsorted.pop();
    let left = []; 
    let right = [];

    for (let row of unsorted) {

        let orderDecision = 
            decideOrder(
                orderedValuesSelector(row), 
                orderedValuesSelector(pivot)
            );

          orderDecision == -1
        ? left.push(row) 
        : right.push(row);

    }

    return quicksort(left, orderedValuesSelector)
        .concat([pivot])
        .concat(quicksort(right, orderedValuesSelector));

};

/*
    Take two points or arrays of values.  Compare the 
    first value in each for <, >, or =.  If < or >, then 
    that's your result.  If =, then compare the second 
    value in each array.  Only if all are =, then output =.  
    As usual -1, 0, and 1 correspond to <, =, > respectively.
    Valid < invalid (e.g. "x" < undefined) (but is this 
    going to kill performance?)
*/  
let decideOrder = (
    leftVals,
    rightVals
) => {

    if (!Array.isArray(leftVals))
        leftVals = [leftVals];

    if (!Array.isArray(rightVals))
        rightVals = [rightVals];
        
    let length = 
            leftVals.length > rightVals.length
        ? leftVals.length
        : rightVals.length;

    for(let i = 0; i < length; i++) {

        let leftVal = leftVals[i];
        let rightVal = rightVals[i];

        //let isLeftValid = leftVal === 0 || leftVal === false || Boolean(leftVal);
        //let isRightValid = rightVal === 0 || rightVal === false || Boolean(rightVal);

        //if (isLeftValid && !isRightValid) return -1
        //if (!leftValid && isRightValid) return 1;
        if (leftVal < rightVal) return -1;
        if (rightVal < leftVal) return 1;

    }

    return 0;

}        

