async function test() {

    let students = $$([
        { id: 'a', name: 'Andrea',  topic: 'Abelard',   bias: 'analytic'    },
        { id: 'b', name: 'Brielle', topic: 'Bentham',   bias: 'buddhist'    }
    ]);

    let teachers = $$([
        { id: 'b', name: 'Brielle', topic: 'bijection', school: 'Berkley'   },
        { id: 'c', name: 'Chloe',   topic: 'change',    school: 'Cambridge' }
    ]);

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
    
    let result = 
        students  
        .merge(
            teachers, 
            (s,t) => s.id == t.id, 
            (s,t) => (s&&t) ? s : (s||t)
        )
        //.get(); console.log(result);
        .log(null, 'x');

    

}




