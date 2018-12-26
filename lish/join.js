import * as general from "./general.js";
import { hashBuckets } from "./hashBuckets.js";

export class joiner { 

    constructor (
        fromAliases,
        joinAlias,
        fromStore, 
        joinStore, 
        joinType
    ) {

        this.fromAliases = fromAliases;
        this.joinAlias = joinAlias;
        this.fromStore = fromStore;
        this.joinStore = joinStore;
        this.joinType = joinType;

        this.results = [];
        this.fromHits = [];
        this.joinHits = [];

        let firstFromAlias = Array.from(this.fromAliases)[0];

        // Returns a function that in turn:
        // returns a store record based on an index.
        // the record format depends on the number of 
        // aliases.
        this.getFromRecord =            
            this.fromAliases.size > 1 
            ? rowIx => fromStore[rowIx]
            : rowIx => ({[firstFromAlias]: fromStore[rowIx]});
    
    }
            
    executeJoin(matchingLogic) {

        if (typeof arguments[0] == null)
            throw "First argument passed to 'executeJoin' cannot be null";
            
        let parsedFuncs = 
            new general.parser(matchingLogic)
            .pairEqualitiesToObjectSelectors();
            
        if (parsedFuncs)
            return this.executeHashJoin(
                parsedFuncs.leftFunc,
                parsedFuncs.rightFunc
            );

        return this.executeLoopJoin(matchingLogic);

    }

    executeLoopJoin(matchingLogic) {

        let matchingLogicLiteralized = general.inputLiteralizer(matchingLogic);

        for (let fix in this.fromStore) 
        for (let jix in this.joinStore) {

            let fromRecord = this.getFromRecord(fix);
            let joinRecord = {[this.joinAlias]: this.joinStore[jix]};

            if (matchingLogicLiteralized(fromRecord, joinRecord)) 
                this.executeInnerPartForRow(fromRecord, joinRecord, fix, jix);
            
        }

        this.executeLeftPart();
        this.executeRightPart();    
        return this.results;

    }

    executeHashJoin (
        fromEqualitySelector,
        joinEqualitySelector, // optional, coalesces to fromSelector
    ) {

        joinEqualitySelector = joinEqualitySelector || fromEqualitySelector;

        fromEqualitySelector = general.inputLiteralizer(fromEqualitySelector);
        joinEqualitySelector = general.inputLiteralizer(joinEqualitySelector);

        let fromBucketsMap = new hashBuckets(fromEqualitySelector);

        for (let fix in this.fromStore) 
            fromBucketsMap.addItem(this.getFromRecord(fix));

        for (let jix in this.joinStore) {

            let joinRecord = {[this.joinAlias]: this.joinStore[jix]};            
            let fromBucket = fromBucketsMap.getBucket(joinRecord, joinEqualitySelector);

            if (fromBucket)
            for (let fromRecord of fromBucket) 
                this.executeInnerPartForRow(fromRecord, joinRecord);
                
        }

        this.executeLeftPart();
        this.executeRightPart();    
        return this.results;

    }

    executeInnerPartForRow(fromRecord, joinRecord, fix, jix) {

        let flatRecord = {};
        Object.assign(flatRecord, fromRecord);
        Object.assign(flatRecord, joinRecord);
        
        this.results.push(flatRecord);
        this.fromHits[fix] = true;
        this.joinHits[jix] = true;

    }

    executeLeftPart() {

        if (!["left", "full"].includes(this.joinType))
            return;

        for (let fix in this.fromStore) 
            if (!this.fromHits[fix]) 
                this.results.push(
                    this.recordTemplate(this.fromStore[fix])
                );

    }

    executeRightPart() {

        if (!["right", "full"].includes(this.joinType))
            return;

        for (let jix in this.joinStore)
            if(!this.joinHits[jix]) 
                results.push(
                    this.recordTemplate({
                        [this.joinAlias]: this.joinStore[jix]
                    })
                );

    }

    recordTemplate (objectForAssignment = null) {
    
        let record = {};
    
        let aliases = Array.from(this.fromAliases);
        aliases.push(this.joinAlias);
    
        aliases.forEach(a => record[a] = null);
    
        if (objectForAssignment) 
            Object.assign(record, objectForAssignment);
    
        return record;
    
    }

}



