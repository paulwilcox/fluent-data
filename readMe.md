** **I am close to release of Version 1!  Go to [The Future](https://github.com/paulwilcox/FluentDB/wiki/The-Future) and check out 'Before Version 1 Release'.** **

Work with datasets (arrays of objects) by chaining methods -- similar to c# linq method syntax, though in many ways more pleasant. 

- To get up and running, see [Prerequisites](https://github.com/paulwilcox/FluentDB/wiki/Prerequisites)
- To better understand what kind of data this package is intended for, see the [SampleDB](https://github.com/paulwilcox/SampleDB) GitHub page.

## Database Syntax

Operations on **_FluentDB_** datasets typically involve arrow functions inside chained method calls.  The return value of most methods is the **_FluentDB_** instance calling the method.  This chaining approach is often referred to as 'fluent' syntax.  Hence the name 'FluentDB'.

One significant feature of **_FluentDB_** is that the parameters of the arrow functions refer to the object aliases of the loaded datasets.  So, for instance, the 'c' parameter in the filter method below refers to the 'customers' dataset that was passed in during instantiation: 

    let result = $$({
        c: sample.customers
    })
    .filter(c => c.id != 1); 

These features promote concise syntax:

    let result = $$({
        o: sample.orders,
        p: sample.products,
        c: sample.customers,
        pc: sample.potentialCustomers,
        s: sample.shoplifters 
    })
    .merge((o,p) => o.product == p.id, 'both null')  // inner join
    .merge((o,c) => o.customer == c.id, 'both left') // left join
    .merge((o,s) => o.customer == s.id, 'null left') // not exists
    .group(o => o.customer) 
    .reduce(o => ({
        customerId: $$.first(o.customer || 'n/a'), 
        customer: $$.first(o.fullname || 'No Name'),
        orders: $$.count(o.id), 
        price: $$.avg(o.price),
        speed: $$.avg(o.speed),
        rating: $$.avg(o.rating),
        correlation: $$.cor(o.speed, o.rating)
    }))
    .get(o => o);

    console.log(result);

The example above will produce an array of objects grouped by customer, with other properties aggregating information about their ordering behavior. 

## Dataset Syntax

If the database mentality is not desired, there is also a syntax that allows you to work at the dataset level.  Instead of passing an object of arrays, just pass an array:

    result = 
        $$(sample.orders)
        .merge(sample.products, (o,p) => o.product == p.id, 'both null') 
        .get(o => ({o.customerId, o.rating}));

In this syntax, the parameters don't serve as aliases for anything, so you are free to use any labels you like.  For any method, if a second dataset is referenced in the aliases of the database syntax, the actual dataset is passed as a parameter before the lambda.

## Operations and Features

The following operations are available on **_FluentDB_**:

* [filter](https://github.com/paulwilcox/FluentDB/wiki/Using-filter()): Eliminate rows from a dataset. 
* [map](https://github.com/paulwilcox/FluentDB/wiki/Using-map()): Replace each row in a dataset with the result of a function called on each row. 
* [sort](https://github.com/paulwilcox/FluentDB/wiki/Using-sort()): Sort a dataset.  Supports multi-level sorting.
* [join](https://github.com/paulwilcox/FluentDB/wiki/Using-join()): Horizontally join rows from two datasets.  Can do inner, left, right, and full joins. Will use hash algorithm (default) or loop algorithm.
* [group](https://github.com/paulwilcox/FluentDB/wiki/Using-[un]group()): Group rows of a dataset into nested arrays internally sharing a common criteria.
* [reduce](https://github.com/paulwilcox/FluentDB/wiki/Using-reduce[r](https://github.com/paulwilcox/FluentDB/wiki/)): Aggregate a dataset.  Custom aggregations are possible.
* [merge](https://github.com/paulwilcox/FluentDB/wiki/Using-merge()): Merge values from a source dataset into a target dataset.  
* [with](https://github.com/paulwilcox/FluentDB/wiki/Using-with()): Work with a dataset without breaking the fluency/chaining syntax. 
* [get](https://github.com/paulwilcox/FluentDB/wiki/Using-get()): Outputs the dataset in question.
