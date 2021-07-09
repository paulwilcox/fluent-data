/*
    Factor analysis:
        - Applied MultiVariate Statistical Analysis.pdf (p491 pdf 512)

    Rotation:
        - Kaiser 1958 pdf on desktop p8
        - www.real-statistics.com/linear-algebra-matrix-topics/varimax/
            > Note that his numerator (X) is Dk - 2AB, 
            > Based on Kaiser I think it should be 2(k - AB)
            > But his general workthrough is still very helpful and a great crosscheck
        - archive.org/details/ModernFactorAnalysis/page/n323/mode/1up?q=varimax (p304)

    Factor scores:
        - Applied MultiVariate Statistical Analysis.pdf (p517 pdf 538)

*/

function test() {

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

/*
    grades.reduce(
        $$.regress('arithmetic, reading', 'writing', { ci: 0.95 })
    )
    .get()
    .log(null, 'Regression Objects:', 4);

*/
/*
    grades
        .dimReduce('arithmetic, algebra, reading, writing')
        .log(null, 'Factor Analyzed Objects:', 4);
*/

}
