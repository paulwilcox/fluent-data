** **I am close to release of Version 1!  Go to [The Future](The-Future) and check out 'Before Version 1 Release'.** **

Work with datasets (arrays of objects) by chaining methods -- similar to c# linq method syntax, though in many ways more pleasant. 

Includes connectors for indexedDb, and mongoDb (and in the future, for other sources) that utilize the same syntax for interacting with them. 

- To get up and running, see [Prerequisites](Prerequisites)
- To better understand what kind of data this package is intended for, see the [SampleDB](https://github.com/paulwilcox/SampleDB) GitHub page.

## Syntax

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

Perhaps instead of the console, you wish to display in a browser div:

    <div id='printDiv'></div>

The example below cleans the data a bit, and then 'prints' it to the div.

    $$({ r: result })
    .map(r => ({
        ...r,
        price: $$.round(r.price, 2) || '',
        speed: $$.round(r.speed, 2) || '',
        rating: $$.round(r.rating, 2) || '',
        ['correlation (s:r)']: $$.round(r.correlation, 2) || '',
        correlation: undefined
    }))
    .print(r => r, '#printDiv', 'Analysis of Customer Orders');

Which will display:

![Results](https://github.com/paulwilcox/FluentDB/blob/master/images/AnalysisOfOrders.png)

## Operations and Features

The following operations are available on **_FluentDB_**:

* [filter](Using-filter()): Eliminate rows from a dataset. 
* [map](Using-map()): Replace each row in a dataset with the result of a function called on each row. 
* [sort](Using-sort()): Sort a dataset.  Supports multi-level sorting.
* [join](Using-join()): Horizontally join rows from two datasets.  Can do inner, left, right, and full joins. Will use hash algorithm (default) or loop algorithm.
* [group](Using-group()): Group rows of a dataset into nested arrays internally sharing a common criteria.
* [reduce](Using-reduce()-and-reducer()): Aggregate a dataset.  Custom aggregations are possible.
* [print](Using-print()): Show a dataset as an html table. 
* [merge](Using-merge()): Merge values from a source dataset into a target dataset.  
* [get](Using-get()): Execution of all functions above are deferred until execute() is run.

_FluentDB_ also has helper methods to [connect](Using-Connectors) to external datasources such as IndexedDB and MongoDB using similar syntax between them.
