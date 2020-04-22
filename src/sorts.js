
export function* quickSort (
    unsorted, 
    orderSelector
) {

    let lesserThans = [];
    let greaterThans = [];
    let pivot;

    // Get the first of unsorted, establish it as the pivot
    if (!Array.isArray(unsorted)) {
        pivot = unsorted.next();
        if (pivot.done)
            return pivot.value;
        pivot = pivot.value; 
    } 
    else 
        pivot = unsorted.pop();

    let pivotSelection = orderSelector(pivot);

    // Compare remaining rows to the pivot and put into 
    // bins of lesser records and equal/greater records.
    for (let row of unsorted) {

        let orderDecision = decideOrder(
            orderSelector(row), 
            pivotSelection
        );

        orderDecision == -1
            ? lesserThans.push(row) 
            : greaterThans.push(row);

    }

    if (lesserThans.length > 0)
        yield* quickSort(lesserThans, orderSelector);
    
    yield pivot;
    
    if (greaterThans.length > 0)
        yield* quickSort(greaterThans, orderSelector);

};

// Capture lessThan (-1), greaterThan (1) or equal (0)
function decideOrder (
    leftVals,
    rightVals
) {

    // User has option to pass array as orderFunc to
    // created steped orderings.  If they don't pass
    // an array, just wrap in one at this step.
    if (!Array.isArray(leftVals))
        leftVals = [leftVals];
    if (!Array.isArray(rightVals))
        rightVals = [rightVals];
        
    let length = leftVals.length > rightVals.length
        ? leftVals.length
        : rightVals.length;

    for(let i = 0; i < length; i++) {
        if (leftVals[i] < rightVals[i]) return -1;
        if (leftVals[i] > rightVals[i]) return 1;
    }

    return 0;

}        

