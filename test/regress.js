
// Test values come from R output as a crosscheck
async function test () {

    let data = [
        { cases: 7, distance: 560, time: 16.68 },
        { cases: 3, distance: 220, time: 11.50 },
        { cases: 3, distance: 340, time: 12.03 },
        { cases: 4, distance: 80, time: 14.88 },
        { cases: 6, distance: 150, time: 13.75 },
        { cases: 7, distance: 330, time: 18.11 }
    ];

    let results =
        $$(data)
        .reduce({
            regress: $$.regress('cases, distance', 'time', {ci: 0.95}),
            std: $$.std(row => row.cases, true)
        })
        .get();
        
    console.log(results.regress)

    let getCoef = (name) => results.regress.coefficients.find(c => c.name == name);
    let intercept = getCoef('intercept');
    let cases = getCoef('cases');
    let distance = getCoef('distance');
    let model = results.regress.model;

    let test = (desc, val, expected, round) => {
        if ($$.round(val, round) != expected)
            throw `${desc} was ${val}, ${expected} expected.`;
    }

console.log({model})

    test(`F`, model.F, 4.668, 3);
    test(`rSquared`, model.rSquared, 0.7568, 4);
    test(`rSquaredAdj`, model.rSquaredAdj, 0.5947, 4);
    test(`Breuch Pagan`, model.breuchPagan, 5.4282, 4);
    test(`Breuch Pagan pval`, model.breuchPaganPval, 0.06626, 5);
    test(`Coefficient 'intercept' value`, intercept.value, 8.5655813, 7);
    test(`Coefficient 'cases' value`, cases.value, 1.1965163, 7);
    test(`Coefficient 'distance' value`, distance.value, -0.0002018, 7);
    test(`Pvalue for coefficient 'cases'`, cases.pVal, 0.0711, 4);
    test(`Lower confidence interval for 'cases'`, cases.ci[0], -0.19098427, 8);
    test(`Upper confidence interval for 'cases'`, cases.ci[1], 2.58401687, 8);

    return true;


}

