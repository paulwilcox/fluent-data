/*

    Note that the tests for dimReduce have a different flavor.  They check that
    certain broader properties are true, not exact figures.  This is because
    the nature of the algorighms are inexact and subject to change in result.
    This is true not just in the code below but in this area of mathematics
    in general.

    I'm sure there are better ways to test though, so this is not so say there
    is no further room for improvement.

*/
function test () {

    let _math = (ar,al) => ({ arithmetic: ar, algebra: al });
    let _lang = (r,w) => ({ reading: r, writing: w });

    let grades = $$([
        { name: 'Pat', ..._math(65, 63), ..._lang(95, 10) },
        { name: 'Kelly', ..._math(62, 65), ..._lang(94, 10) },
        { name: 'Jessie', ..._math(96, 98), ..._lang(64, 10) },
        { name: 'Chris', ..._math(93, 95), ..._lang(61, 11) },
        { name: 'Alex', ..._math(5, 3), ..._lang(55, 11) },
        { name: 'Drew', ..._math(2, 5), ..._lang(54, 11) },
        { name: 'Jordan', ..._math(46, 48), ..._lang(4, 10) },
        { name: 'Cam', ..._math(43, 45), ..._lang(1, 11) },
        { name: 'Noisy', ..._math(75, 25), ..._lang(75, 10) },
        { name: 'Hazy', ..._math(25, 75), ..._lang(25, 11) }
    ]);

    let reduced = grades.reduce(
        $$.dimReduce('arithmetic, algebra, reading, writing', { attachData: true }),
    )
    .data;

    let results = reduced.data
        .reduce({ 

           rr: $$.regress('arithmetic, algebra, reading', 'writing', { ci: 0.95 }),

           // just dim0, because dim1 already incorporates writing
           rd: $$.regress('dim0, reading', 'writing', { ci: 0.95 })

        })
    .get();

    if(reduced.rotated.loadings.nCol != 2) 
        throw `The number of factors with eigenvalues above 1 is no longer 2.`;

    let dim0 = reduced.rotated.sumSqs.getCell(0,0);
    let dim1 = reduced.rotated.sumSqs.getCell(0,1);

    if (Math.abs(2.259 - dim0) >= 0.1)
        throw `The rotated value for dim0 has strayed more than 0.1 from its previous value`;

    if (Math.abs(1.035 - dim1) >= 0.1)
        throw `The rotated value for dim1 has strayed more than 0.1 from its previous value`;

    if (results.rd.model.pVal >= results.rr.model.pVal)
        throw `The dimReduced regression is no longer more significant than the original regression`;

    if (results.rd.model.pVal > 0.5)
        throw `the dimReduced regression is no longer significant`;

}