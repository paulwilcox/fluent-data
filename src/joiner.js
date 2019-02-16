import { parser } from './parser.js';
import { hashBuckets } from './hashBuckets.js';

export class joiner { 

    constructor (fromDs, joinDs, joinType) {

        this.fromDs = fromDs;
        this.joinDs = joinDs;
        this.joinType = joinType;

        this.results = [];
        this.fromHits = [];
        this.joinHits = [];
        
    }
            
    executeJoin(matchingLogic, algorithm) {

        if (typeof arguments[0] == null)
            throw "First argument passed to 'executeJoin' cannot be null";
            
        if (['default', 'hash'].includes(algorithm)) {
                
            let parsedFuncs = 
                parser.pairEqualitiesToObjectSelectors(matchingLogic);

            if (parsedFuncs) 
                try {
                    return this.executeHashJoin(
                        parsedFuncs.leftFunc,
                        parsedFuncs.rightFunc
                    );
                }
                catch(e) {   

                    if (algorithm == 'hash') // explicit hash should fail.
                        throw e; 

                    console.warn(
                        "Join matching logic successfully parsed into hashselector" +
                        "functions.  However, an error was encountered in processing " + 
                        "the hash join.  Switching from hash join to loop join.  " + 
                        "Relevant information will follow in the subsequent logs."
                    );

                    console.log({
                        error: e,
                        matchingLogic: matchingLogic.toString(),
                        parsedFromHashSelector: parsedFuncs.leftFunc.toString(),
                        parsedJoinHashSelector: parsedFuncs.rightFunc.toString() 
                    });

                    algorithm = 'loop';

                }

        }

        return this.executeLoopJoin(matchingLogic);

    }

    executeLoopJoin(matchingLogic) {

        for (let fix in this.fromDs) 
        for (let jix in this.joinDs) {

            let fromRow = this.fromDs[fix];
            let joinRow = {[this.joinKey]: this.joinDs[jix]};

            if (matchingLogic(fromRow, joinRow)) 
                this.executeInnerPartForRow(fromRow, joinRow, fix, jix);
            
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

        let fromBucketsMap = new hashBuckets(fromEqualitySelector);

        for (let fromRow of this.fromDs.data) 
            fromBucketsMap.addItem(fromRow);

        for (let joinRow of this.joinDs.data) {

            let fromBucket = fromBucketsMap.getBucket(joinRow, joinEqualitySelector);

            if (fromBucket)
            for (let fromRow of fromBucket) 
                this.executeInnerPartForRow(fromRow, joinRow);
                
        }

        this.executeLeftPart();
        this.executeRightPart();    
        return this.results;

    }

    executeInnerPartForRow(fromRecord, joinRecord, fix, jix) {
        let flatRecord = Object.assign({}, fromRecord, joinRecord);
        this.results.push(flatRecord);
        this.fromHits[fix] = true;
        this.joinHits[jix] = true;
    }

    executeLeftPart() {

        if (!["left", "full"].includes(this.joinType))
            return;

        for (let fix in this.fromDs) 
            if (!this.fromHits[fix]) 
                this.results.push(
                    this.recordTemplate(this.fromDs[fix])
                );

    }

    executeRightPart() {

        if (!["right", "full"].includes(this.joinType))
            return;

        for (let jix in this.joinDs)
            if(!this.joinHits[jix]) 
                results.push(
                    this.recordTemplate({
                        [this.joinKey]: this.joinDs[jix]
                    })
                );

    }

    recordTemplate (objectForAssignment = null) {
    
        let record = {};
    
        this.fromKeys.forEach(a => record[a] = null);
        record[this.joinKey] = null;
    
        if (objectForAssignment) 
            Object.assign(record, objectForAssignment);
    
        return record;
    
    }

}

joiner.forEachJoinType = operation => 
    ['inner', 'left', 'right', 'full']
    .forEach(operation);
