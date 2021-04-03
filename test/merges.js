async function test() {

    tests(undefined);
    tests('hash');
    tests('loop');
    return true;

}

async function tests (algo) {

    let data = await sample('philosophites, mathematicians');
    let phi = () => $$(data.philosophites);
    let mu = () => $$(data.mathematicians);
    let result;

    result = phi().join(mu(), (p,m) => p.id == m.id, { algo }).get(); 
    new validator(result, 'join')
        .size(1)
        .topics('bijection')
        .biases('buddhist')
        .schools('Berkley');

    result = phi().joinLeft(mu(), (p,m) => p.id == m.id, { algo }).get(); 
    new validator(result, 'joinLeft')
        .size(2)
        .topics('Abelard', 'bijection')
        .biases('analytic', 'buddhist')
        .schools('Berkley');

    result = phi().joinRight(mu(), (p,m) => p.id == m.id, { algo }).get();
    new validator(result, 'joinRight')
        .size(2)
        .topics('bijection', 'change')
        .biases('buddhist')
        .schools('Berkley', 'Cambridge');

    result = phi().joinFull(mu(), (p,m) => p.id == m.id, { algo }).get();
    new validator(result ,'joinFull')
        .size(3)
        .topics('Abelard', 'bijection', 'change')
        .biases('analytic', 'buddhist')
        .schools('Berkley', 'Cambridge');

    result = phi().exists(mu(), (p,m) => p.id == m.id, { algo }).get();
    new validator(result, 'exists')
        .size(1)
        .topics('Bentham')
        .biases('buddhist')
        .schools();

    result = phi().notExists(mu(), (p,m) => p.id == m.id, { algo }).get();
    new validator(result, 'notExists')
        .size(1)
        .topics('Abelard')
        .biases('analytic')
        .schools();

    result = phi().notExistsFull(mu(), (p,m) => p.id == m.id, { algo }).get();
    new validator(result, 'notExistsFull')
        .size(2)
        .topics('Abelard', 'change')
        .biases('analytic')
        .schools('Cambridge');

}

class validator {

    constructor(data, name) {
        this.name = name;
        this.data = data;
    }

    size(expectedSize) {
        if (this.data.length != expectedSize)
            throw `'${this.name}' did not result in ${expectedSize} records.`;
        return this;
    }

    topics(...expectedValues) { this._validateProps('topic', expectedValues); return this; }
    biases(...expectedValues) { this._validateProps('bias', expectedValues); return this; }
    schools(...expectedValues) { this._validateProps('school', expectedValues); return this; }

    _validateProps(propName, expectedValues) {

        if (expectedValues.length == 0) 
            if (this.data.some(row => row[propName] !== undefined))
                throw `'${this.name}' has at least one row with '${propName}' defined.  ` +
                    `The expectation is that no rows have this property defined.`;

        else 
            for (let expectedValue of expectedValues) 
                this._validateProp(propName, expectedValue);

    }

    _validateProp(propName, expectedValue) {
        let rowsFound = this.data.filter(row => row[propName] == expectedValue).length;
        if (rowsFound != 1)
            throw `'${this.name}' did not result in 1 rows ` + 
                `having ${propName} = '${expectedValue}'.`
    }

}
