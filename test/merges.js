async function test () {

    let data = await sample('philosophites, mathematicians');
    let testIt = (mapper, expIds, expTop) => 
        new mergeTester(data, mapper, expIds, expTop);

    testIt('both both', 'a,b,c', 'Bentham'); // full join
    testIt('both left', 'a,b', 'Bentham'); // left join
    testIt('both right', 'b,c', 'Bentham'); // right join
    testIt('both null', 'b', 'Bentham'); // inner join 

    testIt('right both', 'a,b,c', 'bijection'); // upsert
    testIt('right left', 'a,b', 'bijection'); // update
    testIt('right right', 'b,c', 'bijection'); // replace
    testIt('right null', 'b', 'bijection'); // uplete

    testIt('left both', 'a,b,c', 'Bentham'); // insert
    testIt('left left', 'a,b', 'Bentham'); // preserve
    testIt('left right', 'b,c', 'Bentham'); // reverse update
    testIt('left null', 'b', 'Bentham'); // exists

    testIt('null both', 'a,c', undefined); // dual not exists
    testIt('null left', 'a', undefined); // not exists
    testIt('null right', 'c', undefined); // reverse not exists
    testIt('null null', '', undefined); // clear

    return true;

}

class mergeTester {

    constructor(data, mapper, expectedIds, expectedBTopic) {
        this.mapper = mapper;
        this.mapperStr = (typeof mapper == 'string') 
            ? mapper 
            : 'custom mapper';
        this.results = this._merge(data, mapper);
        this._checkIds(expectedIds);
        this._checkTopic('b', expectedBTopic)
    }

    _checkIds(expectedIds) {
        expectedIds = expectedIds == '' ? [] : expectedIds.split(',');
        let resultIds = this.results.map(r => r.id);
        let rExcess = resultIds.some(r => !expectedIds.includes(r));
        let eExcess = expectedIds.some(e => !resultIds.includes(e));
        if(rExcess || eExcess)
            throw `Expected id's for '${this.mapperStr}' ` +
              `are '${expectedIds.join(',')}'; but actual ` + 
              `is '${resultIds.join(',')}'.`;
    }

    _checkTopic(rowId, topic) {

        let row = this.results.find(row => row.id == rowId);
        let isEqual = (a,b) => a == b || (!a && !b);

        if (!topic && !row)
            return;

        if(!isEqual(row.topic, topic))
            throw `Expected topic for '${this.mapperStr}' ` +
                `at row.id == '${rowId}' is '${topic}' ` +
                `but '${row.topic}' was found.`

    }

    _merge(data, mapper) {

        let results = 
            $$({
                p: data.philosophites,
                m: data.mathematicians
            })
            .merge((p,m) => p.id == m.id, mapper)
            .execute(p => p);

        return results;

    }

}