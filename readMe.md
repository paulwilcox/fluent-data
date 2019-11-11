** **I am close to release of Version 1!  Go to [The Future](https://github.com/paulwilcox/FluentDB/wiki/The-Future) and check out 'Before Version 1 Release'.** **

Work with datasets (arrays of objects) by chaining methods -- similar to c# linq method syntax, though in many ways more pleasant. Query datasets composed from regular javascript, from indexedDb, from mongoDb, or mix them using the same API. 

- To get up and running, see [Prerequisites](https://github.com/paulwilcox/FluentDB/wiki/Prerequisites)
- To better understand what kind of data this package is intended for, see the [SampleDB](https://github.com/paulwilcox/SampleDB) GitHub page.

## Syntax

Operations on **_FluentDB_** datasets typically involve arrow functions inside chained method calls.  The return value of most methods is the **_FluentDB_** instance calling the method.  This chaining approach is often referred to as 'fluent' syntax.  Hence the name 'FluentDB'.

One significant feature of **_FluentDB_** is that the parameters of the arrow functions refer to the object aliases of the loaded datasets.  So, for instance, the 'cc' parameter in the filter method below refers to the 'customers' dataset that was passed in during instantiation: 

    let result = $$({
        c: sample.customers
    })
    .filter(c => c.id != 1) 

These features promote concise syntax:

    let result = $$({
        o: sample.orders,
        p: sample.products,
        c: sample.customers,
        pc: sample.potentialCustomers,
        s: sample.shoplifters 
    })
    .join((o,p) => o.product == p.id)
    .join('left hash', (o,c) => o.customer == c.id)
    .merge('delete', o => o.customer, s => s.id)
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
    .catch(err => console.log(err))
    .execute(o => o);

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
    .print(r => r, '#printDiv', 'Analysis of Customer Orders')
    .execute();

Which will display:

![Results](https://github.com/paulwilcox/FluentDB/blob/master/images/AnalysisOfOrders.png)

### Return Value

Upon calling execute(), if any dataset is a promise (such as when using $$.idb() or $$.mongo()), then a promise is returned.  Otherwise, the return value is not a promise.  In either case, the core value is an object of datasets, or in other words: a miniature database.  

## Operations and Features

The following operations are available on **_FluentDB_**:

* [filter](https://github.com/paulwilcox/FluentDB/wiki/Using-filter()): Eliminate rows from a dataset. 
* [map](https://github.com/paulwilcox/FluentDB/wiki/Using-map()): Replace each row in a dataset with the result of a function called on each row. 
* [sort](https://github.com/paulwilcox/FluentDB/wiki/Using-sort()): Sort a dataset.  Supports multi-level sorting.
* [join](https://github.com/paulwilcox/FluentDB/wiki/Using-join()): Horizontally join rows from two datasets.  Can do inner, left, right, and full joins. Will use hash algorithm (default) or loop algorithm.
* [group](https://github.com/paulwilcox/FluentDB/wiki/Using-group()): Group rows of a dataset into nested arrays internally sharing a common criteria.
* [reduce](https://github.com/paulwilcox/FluentDB/wiki/Using-reduce()-and-reducer()): Aggregate a dataset.  Custom aggregations are possible.
* [print](https://github.com/paulwilcox/FluentDB/wiki/Using-print()): Show a dataset as an html table. 
* [merge](https://github.com/paulwilcox/FluentDB/wiki/Using-merge()): Merge values from a source dataset into a target dataset.  
* [execute](https://github.com/paulwilcox/FluentDB/wiki/Using-execute()): Execution of all functions above are deferred until execute() is run.

_FluentDB_ can also [connect](https://github.com/paulwilcox/FluentDB/wiki/Using-dbConnectors-and-dsGetters) to external datasources such as IndexedDB and MongoDB.
