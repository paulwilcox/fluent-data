import hashBuckets from './hashBuckets.js';
import * as g from './general.js';

export default class grouping {

    constructor(key) {
        this.key = key;
        this.parent = null;
        this.children = [];
        this.data = null;
        this.dataIsNaked = false;
    }

    *[Symbol.iterator]() { 
        yield* this.data;
    }

    apply (tableLevelFunc) {

        if (this.dataIsNaked) {
            this.group();
            this.apply(tableLevelFunc);
            this.ungroup();
            return;
        }

        if (this.data != null) {
            this.data = (function*(data) { yield* tableLevelFunc(data); })(this.data); 
            return;
        }

        for(let child of this.children)
            child.apply(tableLevelFunc);

    }

    group (hashFunc) {

        if (this.dataIsNaked) {
            this.data = [this.data];
            this.dataIsNaked = false;
            console.warn(
                'hashFunc is ignored when calling .group()' + 
                'if data is a naked object'
            );
            return;
        }

        if (this.data != null) {
            for(let [key,bucket] of new hashBuckets(hashFunc).addItems([...this.data])) {
                let g = new grouping(JSON.parse(key));
                g.parent = this;
                g.data = bucket;
                this.data = null;
                this.children.push(g);
            }
            return;
        }

        for(let child of this.children)
            child.group(hashFunc);

    }

    ungroup () {

        if (this.children.length == 0 && this.parent == null) {
            let nextVal = this.data.next().value;
            if (!this.data.next().done) 
                throw `calling ungroup on a grouping with no parent ` +
                    `and more than one item in data is not permitted.`
            this.data = nextVal;
            this.dataIsNaked = true;
            return 'there is no parent so you should never see this';
        }
  
        if (this.children.length == 0) {
            if (this.parent.data == null)
                this.parent.data = [];
            this.parent.data.push(...this.data);
            return 'removeFromParent';
        }
        
        for(let ch = this.children.length - 1; ch >= 0; ch--) {
            let child = this.children[ch];
            let decision = child.ungroup();
            if (decision == 'removeFromParent')
                this.children.splice(ch,1);
        }

        return 'doNotRemoveFromParent';

    }

    // TODO: work with grouping.data = non-iterable-object
    log (
        element = null, 
        caption = null,
        mapper = x => x, 
        limit = 50
    ) {

        let data = g.isIterable(this.data) ? [...this.data] : this.data;
        let stringified;
        
        // if param 3 is a number, the use it as a round multiple
        let _mapper = !isNaN(mapper) ? row => g.round(row, mapper) : mapper;

        caption = 
            this.parent === null && caption ? `${caption}`
            : this.parent !== null ? `key: ${JSON.stringify(this.key)}`
            : ``;

        if (this.children.length == 0) 
            stringified = !g.isIterable(data)
                ? caption + JSON.stringify(data,null,2).replace(/"([^"]+)":/g, '$1:') // stackoverflow.com/q/11233498
                : g.tableToString(data, caption, _mapper, limit, true);

        else {
            let stringifieds = this.children.map(child => child.log(element, caption, _mapper, limit)); 
            stringified = g.tableToString(stringifieds, caption, x => x, limit, false);
        }

        if (this.parent !== null) 
            return { stringified };
        else if (!element) 
            console.log(stringified);
        else {
            let div = document.createElement('div');
            div.style = 'white-space:pre; font-family:consolas; font-size:x-small'
            div.innerHTML = stringified
            document.querySelector(element).appendChild(div);
        }

        this.data = data;
        return this;

    }    

    arrayify () {

        let list = [];
        list.key = JSON.stringify(this.key);

        if (this.dataIsNaked)
            return this.data;
        else if (this.data != null) 
            list.push(...this.data);

        for(let child of this.children)
            list.push(child.arrayify());

        return list;

    }

}

grouping.groupify = (arrayified, _parent) => {

    let grp = new grouping(arrayified.key ? JSON.parse(arrayified.key) : null);
    grp.parent = _parent || null;

    for(let row of arrayified) 
        if (Array.isArray(row)) {
            grp.children == grp.children || [];
            grp.children.push(grouping.groupify(row, grp))
        }
        else 
            grp.data = (function*() { yield* arrayified; })()

    return grp;

}
