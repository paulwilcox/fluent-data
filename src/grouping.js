import hashBuckets from './hashBuckets.js';

export default class grouping {

    constructor(key) {
        this.key = key;
        this.parent = null;
        this.children = [];
        this.data = null;
    }

    apply (tableLevelFunc) {

        if (this.data != null)
            this.data = (function*(data) { yield* tableLevelFunc(data); })(this.data); 

        for(let child of this.children)
            child.apply(tableLevelFunc);

    }

    arrayify () {

        let list = [];
        list.key = this.key;

        if (this.data != null) 
            list.push(...this.data);

        else 
            for(let child of this.children)
                list.push(child.arrayify());

        return list;

    }

    group (hashFunc) {

        for(let child of this.children)
            child.group(hashFunc);
        
        for(let [key,bucket] of new hashBuckets(hashFunc).addItems([...this.data])) {
            let g = new grouping(key);
            g.parent = this;
            g.data = bucket;
            this.data = null;
            this.children.push(g); 
        }

    }

    ungroup () {

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

}
