// allows you to prepend or append code to an existing function
export class extender {
    
    constructor(container, funcName) {
        this.container = container;
        this.funcName = funcName;
        this.returnFunc = 'original';
    }

    prepend(func, returnThis = false) {
        this.prependFunc = func;
        if (returnThis)
            this.returnFunc = 'prepend';
        return this;
    }

    append(func, returnThis = false) {
        this.appendFunc = func;
        if (returnThis)
            this.returnFunc = 'append';
        return this;
    }

    // Note that e.prependFunc and e.appendFunc will utilize
    // the arguments passed to the original function.  
    execute () {

        let e = this;

        (function() {

            let proxied = e.container[e.funcName];

            e.container[e.funcName] = function() {
                
                if (e.prependFunc) 
                    var prependRes = e.prependFunc.apply( this, arguments );
                
                let result = proxied.apply( this, arguments );
                
                if (e.appendFunc) 
                    var appendRes = e.appendFunc.apply( this, arguments );
                
                return e.returnFunc == 'prepend' ? prependRes
                    :  e.returnFunc == 'append' ? appendRes
                    :  result;

            };

        })();

    }

}