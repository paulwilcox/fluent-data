import { parser } from './parser.js';
import { hashBuckets } from './hashBuckets.js';
import { thenRemoveUndefinedKeys } from './mapper.js';

export class joiner { 

    constructor (fromDs, joinDs, options) {

        this.options = options;
        this.fromDs = fromDs;
        this.joinDs = joinDs;
        this.joinType = this.extractOption('inner left right full', 'inner');
        this.algorithm = this.extractOption('hash loop', 'hash');
        this.results = [];

    }
            
    execute(matchingLogic, mapper) {

        if (typeof arguments[0] == null)
            throw "'matchingLogic in 'executeJoin' cannot be null";

        if (!mapper) 
            mapper = (fromRow, joinRow) => Object.assign({}, fromRow, joinRow);

        mapper = thenRemoveUndefinedKeys(mapper);

        if (this.algorithm == 'hash') {
                
            let parsed = parser.pairEqualitiesToObjectSelectors(matchingLogic);

            if (parsed) 
                return this.executeHashJoin(
                    parsed.leftFunc, 
                    parsed.rightFunc,
                    mapper
                );

        }

        return this.executeLoopJoin(matchingLogic, mapper);

    }

    executeLoopJoin(matchingLogic, mapper) {

        let fromHits = [];
        let joinHits = [];

        for (let fix in this.fromDs.data) 
        for (let jix in this.joinDs.data) {

            let fromRow = this.fromDs.data[fix];
            let joinRow = this.joinDs.data[jix];

            if (matchingLogic(fromRow, joinRow)) { 
                this.results.push(
                    mapper(fromRow, joinRow)
                );
                fromHits[fix] = true;
                joinHits[jix] = true;
            }
            
        }

        if (["left", "full"].includes(this.joinType))
        for (let fix in this.fromDs.data) 
        if (!fromHits[fix]) 
            this.results.push(
                mapper(this.fromDs.data[fix], {})
            );
    
        if (["right", "full"].includes(this.joinType))
        for (let fix in this.fromDs.data) 
        if (!joinHits[fix]) 
            this.results.push(
                mapper({}, this.joinDs.data[fix])
            );

        return this.results;

    }

    executeHashJoin (
        fromEqualitySelector,
        joinEqualitySelector, // optional, coalesces to fromSelector
        mapper
    ) {

        joinEqualitySelector = joinEqualitySelector || fromEqualitySelector;

        // Create a bucketed hashtable from the left-hand ('from') rows 
        let fromBucketsMap = new hashBuckets(fromEqualitySelector);
        for (let fromRow of this.fromDs.data) 
            fromBucketsMap.addItem(fromRow);

        for (let joinRow of this.joinDs.data) {

            // Get the left-hand rows that match the right-hand ('join') row.
            // These are removed from the hashtable. 
            let fromBucket = fromBucketsMap.getBucket(joinRow, joinEqualitySelector, true);

            // Add the merged row to the results.
            if (fromBucket)
            for (let fromRow of fromBucket) 
                this.results.push(
                    mapper(fromRow, joinRow)
                );
               
            // If there were no matches, just add the unmerged right-hand row to the results.
            else if (["right", "full"].includes(this.joinType))
                this.results.push({}, joinRow);

        }

        // Add any remaining left-hand rows in the hash-table to the results
        if (["left", "full"].includes(this.joinType))
        for(let fromBucket of fromBucketsMap.getBuckets()) 
        for(let fromRow of fromBucket) 
            this.results.push(fromRow, {});

        return this.results;

    }

    extractOption(searchTerms, defaultTerm) {

        let opts = this.options.split(' ').map(o => o.trim());
        let terms = searchTerms.split(' ').map(t => t.trim());
        
        let option =  opts.filter(o => terms.includes(o))[0]; 
        
        if (option == undefined && defaultTerm != undefined)
            option = defaultTerm;

        return option;

    }

}

joiner.forEachJoinType = operation => 
    ['inner', 'left', 'right', 'full']
    .forEach(operation);
