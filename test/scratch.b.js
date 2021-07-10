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

import * as g from '../src/general.js';

function test() {

    let purchases = $$([
        { customerId: 'b', books: 4, time: 16.68, price: 560, rating: 73 },
        { customerId: 'a', books: 1, time: 11.50, price:  80, rating: 95 },
        { customerId: 'a', books: 1, time: 12.03, price: 150, rating: 92 },
        { customerId: 'b', books: 2, time: 14.88, price: 220, rating: 88 },
        { customerId: 'a', books: 3, time: 13.75, price: 340, rating: 90 },
        { customerId: 'b', books: 4, time: 18.11, price: 330, rating: 66 },
        { customerId: 'a', books: 5, time: 21.09, price: 401, rating: 54 },
        { customerId: 'b', books: 5, time: 23.77, price: 589, rating: 31 }
    ]);

    
    let str = g.tableToString(purchases.get(), null, row => g.round(row, 1e-8));
    console.log(str);

    purchases
        .reduce({
            corMatrix: $$.corMatrix('books, price, time'),
        })
        .get()
        .corMatrix
        .log(null, null, 1e-8);

}
