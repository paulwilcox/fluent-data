import { scores, customers, sampleIdb } from "./data.js";
import { lish } from "../lish/lish.js";

/* 
    TODOS: 
    
    - Test, test, test.
        > for performance
        > for bugs
    - Allow override for explicit join implementation.
    - Deal with redundancy of key.size check for inputLiteralizers 
    - Nested table css (either darker or greater margins)

*/

let output = 'all';

// in memory array syntax
export var LishResultJs = 

    new lish()
    .from({
        sc: scores,
        st: lish.idbSource('students', sampleIdb) 
    })
    .filter(sc => [sc.score != 0]) // not working
    .join( 
        (sc,st) => sc.student == st.id
    )
    .orderBy(sc => [sc.score])
    .groupBy(st => st.name)
    .map('tm', (sc,st) => ({
        scoreId: sc.id, 
        studentId: sc.student, 
        student: st.name, 
        score: sc.score
    }))
    .print(tm => tm, "#lishResultJs", "Lish Result Js");

// IndexedDb syntax
export var LishResult = 

    new lish(sampleIdb, 'idb')
    .from({
        o: 'orders',
        p: 'products',
        c: customers
    })
    .filter(o => o.product != 123456) 
    .join( 
        { inner: (o,p) => o.product == p.id },
        { left: (o,c) => o.customer == c.id }
    )
    .orderBy((o,p) => o.product)
    .groupBy(o => o.product)
    .fold('f', {
        product:        lish.key(o => o.product),
        revenue:        lish.sum(p => p.price), 
        transactions:   lish.count(p => p.price),
        avgRating:      lish.avg(o => o.rating),
        stdRating:      lish.std(o => 
                            o.rating,
                            x => Math.round(x * 100) / 100
                        ),
        corSR:          lish.cor(
                            o => [o.speed, o.rating], 
                            x => Math.round(x * 100) / 100
                        )
    })
    .print(f => f, '#lishResult', 'Lish Result');


// n becomes undefined after merge('foods')
export var MergeResult = 
    new lish(sampleIdb, 'idb')
    .from({
        n: [
            { id: 1, name: 'taquitos' },
            { id: 4, name: 'alfredo' },
            { id: 5, name: 'pizza' }
        ],
        o: [
            { id: 7, name: 'sandwich' },
            { id: 8, name: 'egg roll' }
        ]
    })
    .print('foods', '#beforeMerge', 'Before: foods')
    .print(n => n, '#beforeMerge', 'Before: n')
    .print(o => o, '#beforeMerge', 'Before: o')
    .merge(
        'n', 
        o => o,
        o => o.id 
    )
    .merge(
        'foods',
        n => n,
        n => n.id  
    )
    .print(n => n, '#afterMerge', 'After: n')
    .print('foods', '#afterMerge', 'After: foods')
    .print(o => o, '#afterMerge', 'After: o');
