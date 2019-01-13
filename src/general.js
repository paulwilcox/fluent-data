
export let objectKeyValuesAreEqual = (left, right) => {

    let distinctKeys = 
        Array.from(
            new Set(
                Object.keys(left)
                .concat(
                    Object.keys(right)
                )
            )
        );

    for (let key of distinctKeys) 
        if (left[key] !== right[key])
            return false;
            
    return true;

}

export let isSubsetOf = (sub, sup) =>  
    setEquals (
        new Set(
            [...sub]
            .filter(x => [...sup].indexOf(x) >= 0) // intersection
        ), 
        sub
    );

// Max Leizerovich: stackoverflow.com/questions/
//   31128855/comparing-ecma6-sets-for-equality
export let setEquals = (a, b) =>
    a.size === b.size 
    && [...a].every(value => b.has(value));

// Takes function inputs and makes it so that those serve as references
// to the properties of an object.
export let inputLiteralizer = functionToProcess => {
        
    let aliases = new parser(functionToProcess).parameters;

    let applyIt = (func, aliases, args) => {

        let objectToApply = {};

        for(let arg of args)
        for(let alias of aliases) 
            if(Object.keys(arg).includes(alias))
                objectToApply[alias] = arg[alias];

        return func
            .apply(
                null,
                Object.values(objectToApply)
            ); 

    };

    return (...args) => applyIt(functionToProcess, aliases, args);

}  

export let stringifyObject = obj => {

    // todo: find out if this is bad.  But for now it's
    // fixing something.
    if (obj === undefined) 
        return '';

    let isObject = variable => 
           variable 
        && typeof variable === 'object' 
        && variable.constructor === Object;

    if (!isObject(obj))
        return obj.toString();

    let stringified = '[';

    let keys = Object.keys(obj).sort();

    for (let key of keys) {
        let val = obj[key];
        let valToStringify = isObject(val) ? stringifyObject(val) : val;
        stringified += `[${key},${valToStringify}]`;
    }

    return stringified + ']';

}

export function applyToNestedArray (
    maybeNested, 
    funcToApply
) {

    // if not nested, apply the function
	if (!Array.isArray(maybeNested[0]) || maybeNested.length == 0) 
        return funcToApply(maybeNested);

	let output = [];

	for (let nestedArray of maybeNested) 
	    output.push(
		    applyToNestedArray(nestedArray, funcToApply)
	    );

	return output;

}

export let isString = input =>
    typeof input === 'string' 
    || input instanceof String;

export let isFunction = input => 
    typeof input === 'function';

export class parser {

    // Parse function into argument names and body
    constructor (func) {

        this.parameters = [];
        this.body = "";

        let uncommented = 
            func.toString() 
            .replace(/[/][/].*$/mg,'') // strip single-line comments
            .replace(/[/][*][^/*]*[*][/]/g, ''); // strip multi-line comments  
	
        let arrowIx = uncommented.indexOf('=>');
        let braceIx = uncommented.indexOf('{');	

        if (arrowIx == -1 && braceIx == -1) {
            console.trace();
            throw "it seems that a non-function was passed to 'parser'";
        }

        let splitIx = 
            braceIx == -1 ? arrowIx
            : arrowIx == -1 ? braceIx
            : arrowIx < braceIx ? arrowIx 
            : braceIx;
        
        let isArrow = splitIx == arrowIx;
        
        let left = uncommented.slice(0,splitIx);
        let right = uncommented.slice(splitIx);

        if(isArrow)
            right = right.slice(2); // get rid of the arrow
        else {
            let parenIx = left.indexOf('(');
            left = left.slice(parenIx);
        }

        this.parameters = 
            left
            .replace(/[()\s]/g, '')
            .split(',');

        this.body =
            right
            .replace(/^\s*\{|\}\s*$/g,'')
            .replace(/^\s*|\s*$/g,'');

    }

    // Converts (v,w) => v.a = w.a && v.b == w.b 
    // into v => { x0 = v.a, x1 = v.b }
    // and w => { x0 = w.a, x1 = w.b }
    pairEqualitiesToObjectSelectors() {

        let leftParam = this.parameters[0];
        let rightParam = this.parameters[1];

            let splitBodyByAnds = this.body.split(/&&|&/);

            let leftEqualities = [];
            let rightEqualities = [];

            for (let aix in splitBodyByAnds) {

                let andPart = splitBodyByAnds[aix];
                let eqParts = andPart.split(/==|=/);
                let leftEq;
                let rightEq;

                if (eqParts.length != 2)
                    return;

                for (let eix in eqParts) {

                    let ep = eqParts[eix].trim();

                    if (/[^A-Za-z0-9_. ]/.test(ep)) 
                            return null;

                    if (ep.indexOf(`${leftParam}.`) > -1)
                        leftEq = ep;
                    else if (ep.indexOf(`${rightParam}.`) > -1)
                        rightEq = ep;
                    else
                        return null; 

                }	    
                
                leftEqualities[aix] = `x${aix}: ${leftEq}`;
                rightEqualities[aix] = `x${aix}: ${rightEq}`;

            }

        return {
            leftFunc: new Function(leftParam, `return { ${leftEqualities.join(', ')} };`),
            rightFunc: new Function(rightParam, `return { ${rightEqualities.join(', ')} };`)
        };

    }

}