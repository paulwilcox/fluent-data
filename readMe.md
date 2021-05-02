
## Summary 

This library allows you to work with data structured as a table or as a matrix and provides 
you with many of the methods you would expect when working with such things.

A `dataset` represents a collection of object-rows.  Among other capacities, here you have the
ability to map, filter, sort, group, reduce, and join.  These methods can seem similar to 
those found on `Array`.  However, they are designed to work with objects as rows.  Furthermore,
some SQL-like capacity (e.g. left join, exists) and deeper statistics (e.g. multiple regression) 
are available that you just cannot get in vanilla javacript.

A `matrix` is a rectangular collection of numbers on which particular mathematical operations 
are defined.  This library offers many of the expected operations of matrix algebra.  This 
includes matrix multiplication, addition, various methods of 'apply' functionality, varous 
decompositions, pseudoinvering, and production of eigen values and vectors.   

Click on the links below to see more information in each area:

- [dataset](https://github.com/paulwilcox/fluent-data/wiki/Dataset) methods and examples
- [matrix](https://github.com/paulwilcox/fluent-data/wiki/Matrix) methods and examples
- [changelog](https://github.com/paulwilcox/fluent-data/wiki/changelog)


## Getting Started

### To install:

    npm install fluent-data

### To import:

    // client
    import $$ from './node_modules/fluent-data/dist/fluent-data.client.js';

    // server
    let $$ = require('fluent-data');

    // but the examples in this documentation will use
    let $$ = require('./dist/fluent-data.server.js');

## Dataset Example:

Consider the following arrays:

[javascript]: # (id=import)

    let customers = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Benny' } 
    ];

    let purchases = [
        { customer: 2, speed: 15, rating: 50, storeId: 1 },
        { customer: 1, speed: 5, rating: 90, storeId: 1 },
        { customer: 1, speed: 7, rating: 55, storeId: 1 },
        { customer: 2, speed: 6, rating: 88, storeId: 1 },
        { customer: 1, speed: 25, rating: 35, storeId: 1 },
        { customer: 1, speed: 40, rating: 2, storeId: 3, closed: true },
        { customer: 2, speed: 4, rating: 88, storeId: 1 },
        { customer: 1, speed: 1, rating: 96, storeId: 2 },
        { customer: 1, speed: 2, rating: 94, storeId: 2 },
        { customer: 1, speed: 1, rating: 94, storeId: 2 }
    ];

[--]: # ()

The following example converts the to dataset and uses many of the methods available.

[javascript]: # (log=true,setup=import)

    let $$ = require('./dist/fluent-data.server.js');

    $$(purchases)
        .filter(p => !p.closed)
        .joinLeft(customers, (p,c) => p.customer == c.id) 
        .group(p => [p.customer, p.storeId]) 
        .reduce({
            customer: $$.first(p => p.name),
            store: $$.first(p => p.storeId),
            orders: $$.count(p => p.id), 
            speed: $$.avg(p => p.speed),
            rating: $$.avg(p => p.rating),
            correlation: $$.cor(p => [p.speed, p.rating]) 
            // other reducers, such as multiple regression, are built in!
        })
        .sort(p => [p.customer, -p.rating]) 
        .log(null, 'purchases:', 
            p => $$.round({ ...p, orders: undefined}, 3)
        );

    // use 'get' as opposed to 'log' to assign to a variable

[--]: # ()

This results in three rows for analysis:

[javascript]: # (output=true)

    purchases:
    ┌──────────┬───────┬────────┬────────┬─────────────┐
    │ customer │ store │ speed  │ rating │ correlation │
    ├──────────┼───────┼────────┼────────┼─────────────┤
    │ Alice    │ 2     │ 1.333  │ 94.667 │ -0.5        │
    │ Alice    │ 1     │ 12.333 │ 60     │ -0.832      │
    │ Benny    │ 1     │ 8.333  │ 75.333 │ -0.985      │
    └──────────┴───────┴────────┴────────┴─────────────┘

[--]: # ()

## Matrix Example:

Consider the following arrays, converted to matricies:

[javascript]: # (id=mxImport)

    let $$ = require('./dist/fluent-data.server.js');

    let community = $$([
        { marker: 'Applewood Park', x: 0, y: 0 },
        { marker: 'Orangewood School', x: 10, y: 0},
        { marker: 'Kiwitown Market', x: 1, y: 10 },
        { marker: `The Millers`, x: -5, y: 0 },
        { marker: 'The Romeros', x: 0, y: -5 },
        { marker: 'The Lees', x: 5, y: 5 },
        { marker: 'The Keitas', x: 5, y: 0 },
        { marker: 'The Lebedevs', x: 15, y: 5 }
    ]).matrix('x, y', 'marker');

    let transformer = new $$.matrix([
        [ 1, 0.4 ],
        [ 0, Math.pow(3,0.5) / 2 ]
    ]);

[--]: # ()

The following exmaple transforms the community data so that the new 
positions of the park, school, and market form an equilateral triangle. 
Then it analyzes the eigen properties of the transformer matrix.

[javascript]: # (log=true,setup=mxImport)

    let eigen = transformer.eigen();
    
    community
        .transform(transformer)
        .log(null, 'Equilateralized Community:', row => $$.round(row,8));
    
    console.log('\nTransformer Eigenvalues:', eigen.values);
        
    eigen.vectors.log(null, '\nTransformer Eigenvectors:', row => $$.round(row,8)); 

[--]: # ()

[javascript]: # (output=true)

    Equilateralized Community:
    ┌───────────────────┬────┬─────────────┐
    │                   │ x  │ y           │
    ├───────────────────┼────┼─────────────┤
    │ Applewood Park    │ 0  │ 0           │
    │ Orangewood School │ 10 │ 0           │
    │ Kiwitown Market   │ 5  │ 8.66025404  │
    │ The Millers       │ -5 │ 0           │
    │ The Romeros       │ -2 │ -4.33012702 │
    │ The Lees          │ 7  │ 4.33012702  │
    │ The Keitas        │ 5  │ 0           │
    │ The Lebedevs      │ 17 │ 4.33012702  │
    └───────────────────┴────┴─────────────┘
    
    Transformer Eigenvalues: [ 1, 0.8660254 ]
    
    Transformer Eigenvectors:
    ┌────┬────┬─────────────┐
    │    │ c0 │ c1          │
    ├────┼────┼─────────────┤
    │ r0 │ 1  │ -0.94822626 │
    │ r1 │ 0  │ 0.31759558  │
    └────┴────┴─────────────┘

[--]: # ()

<!--

`fluent-data` syntax is similar to LINQ in C#.  C# developers frustrated with the lack of a LINQ functionality in javascript may be encouraged by fluent-data.  Some of the syntax can even be friendlier and more powerful in comparison.   


## Contrasts

<details>
<summary>Comparison to LINQ in C#</summary>:

`group()` is similar to C#'s `IEnumerable.GroupBy`, but has significant differences.  
The following code is how you would do something similar with LINQ.  Notice the need
for a `ThenBy()` because of the lack of any easy way to compare arrays for equality
in c#.  Also notice the need for a nesting of LINQ functions to produce the filtering
in each group.  Fluent-data doses this automatically, with any level of groupings.

    purchases
        .Select(p => new {
            p.customerId,
            p.books,
            p.time,
            p.price,
            p.rating,
            flag: p.rating < 60 ? 'bad' : p.rating < 90 ? 'okay' : 'good'
        })    
        .GroupBy(p => p.CustomerId)
        .ThenBy(p => p.flag)
        .Select(grp => grp.Where(p => p.rating > 50))
        .ToArray();

</details>

-->






































