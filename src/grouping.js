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

    log (
        element = null, 
        caption = null,
        func = x => x, 
        limit = 50
    ) {

        caption = 
            this.parent === null && caption ? `${caption}\r\n`
            : this.parent !== null ? `key: ${JSON.stringify(this.key)}\r\n`
            : ``;

        if (this.children.length == 0) {
            let stringified = 
                caption +
                g.tableToString([...this.data], func, limit, false);
            return { stringified };
        }

        else {
            let stringifieds = this.children.map(child => child.log(element, caption, func, limit)); 
            let stringified = 
                caption +
                g.tableToString(stringifieds, x => x, limit, false)
            return (this.parent !== null) ? { stringified } : stringified;
        }

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
