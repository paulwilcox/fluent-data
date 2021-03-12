
## Announcement(s)

Version 3 introduces a matrix object with a lot of functionality.

Coming soon, factor analysis.  Probable renaming of the library.  Videos.

## Summary 

Manipulate datasets and matricies and perform statistics by chaining methods.  Datasets have the capacity capacity to map, filter, sort, group, reduce, and merge data.  Built in reducers includes multiple regression.  Matrices permit many operations, including matrix algebra, decompositions, eigen calculations, apply capacity, and more.

Dataset methods work like many of the methods on `Array.prototype`.  However, fluent-data makes it much easier to work with arrays when their elements are objects.  It also includes methods simply not available on `Array.prototype`.   

`fluent-data` syntax is similar to LINQ in C#.  C# developers frustrated with the lack of a LINQ functionality in javascript may be encouraged by fluent-data.  Some of the syntax can even be friendlier and more powerful in comparison.   

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

The following exmaple converts the to dataset and uses many of the methods available.

[javascript]: # (log=true,setup=import)

    let $$ = require('./dist/fluent-data.server.js');

    let result = 
        $$(purchases)
        .filter(p => !p.closed)
        .merge(customers, (p,c) => p.customer == c.id, 'both null') // inner join
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
        .get(p => ({
            ...p, 
            speed: $$.round(p.speed, 2),
            rating: $$.round(p.rating, 2),
            orders: undefined // won't show in final results
        }));

    console.table(result);


[--]: # ()

This results in three rows for analysis:

[javascript]: # (output=true)

    ┌─────────┬──────────┬───────┬───────┬────────┬─────────────────────┐
    │ (index) │ customer │ store │ speed │ rating │     correlation     │
    ├─────────┼──────────┼───────┼───────┼────────┼─────────────────────┤
    │    0    │ 'Alice'  │   2   │ 1.33  │ 94.67  │        -0.5         │
    │    1    │ 'Alice'  │   1   │ 12.33 │   60   │ -0.8315708645692353 │
    │    2    │ 'Benny'  │   1   │ 8.33  │ 75.33  │ -0.9853292781642932 │
    └─────────┴──────────┴───────┴───────┴────────┴─────────────────────┘

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
    
    console.log('Equilateralized Community:');
    community.transform(transformer).log(8);
    
    console.log('\nTransformer Eigenvalues:', eigen.values);
        
    console.log('\nTransformer Eigenvectors:');
    eigen.vectors.log(8); 


[--]: # ()

[javascript]: # (output=true)

    Equilateralized Community:
    ┌───────────────────┬────┬─────────────┐
    │      (index)      │ x  │      y      │
    ├───────────────────┼────┼─────────────┤
    │  Applewood Park   │ 0  │      0      │
    │ Orangewood School │ 10 │      0      │
    │  Kiwitown Market  │ 5  │ 8.66025404  │
    │    The Millers    │ -5 │      0      │
    │    The Romeros    │ -2 │ -4.33012702 │
    │     The Lees      │ 7  │ 4.33012702  │
    │    The Keitas     │ 5  │      0      │
    │   The Lebedevs    │ 17 │ 4.33012702  │
    └───────────────────┴────┴─────────────┘
    
    Transformer Eigenvalues: [ 1, 0.8660254 ]
    
    Transformer Eigenvectors:
    ┌─────────┬────┬─────────────┐
    │ (index) │ c0 │     c1      │
    ├─────────┼────┼─────────────┤
    │   r0    │ 1  │ -0.94822626 │
    │   r1    │ 0  │ 0.31759558  │
    └─────────┴────┴─────────────┘

[--]: # ()

## Operations and Features

The following operations are available on a fluent-data dataset:

* [get](https://github.com/paulwilcox/fluent-data/wiki/Map-and-Get#Getting): Returns the dataset as an array.
* [map](https://github.com/paulwilcox/fluent-data/wiki/Map-and-Get#Mapping): Replaces each row in a dataset with the result of 
  a function called on each row. 
* [filter](https://github.com/paulwilcox/fluent-data/wiki/Filtering): Chooses particular rows from a dataset. 
* [sort](https://github.com/paulwilcox/fluent-data/wiki/Sorting): Sorts a dataset.  
* [distinct](https://github.com/paulwilcox/fluent-data/wiki/Distinct): Eliminates duplicates in a dataset.
* [merge](https://github.com/paulwilcox/fluent-data/wiki/Merging): Brings in values from another set of data.  Can be done 
  horizontally (such as with a join) or vertically (such as with an insert).
* [group](https://github.com/paulwilcox/fluent-data/wiki/Grouping): Group rows of a dataset into nested datasets.  Or reverse 
  this with [ungroup](https://github.com/paulwilcox/fluent-data/wiki/Grouping#Ungrouping-Rows)
* [reduce](https://github.com/paulwilcox/fluent-data/wiki/Reducing): Aggregate a dataset.  Create custom aggregators as well. 
  Built in reducers allow some deeper [statistics](https://github.com/paulwilcox/fluent-data/wiki/Statistics), such as multiple 
  regression.
* [with](https://github.com/paulwilcox/fluent-data/wiki/With): Work with a dataset without breaking the fluency/chaining
  syntax. 

The operations available on a Matrix are perhaps too many to list here.  Best
to visit the page dedicated to that object as a whole:

* [matrix](https://github.com/paulwilcox/fluent-data/wiki/Matrix): A class representing a matrix, complete with many matrix
  calculations.

Click on the links to go to the wiki and learn more about them.

To see possible directions for this library, go to [The-Future](https://github.com/paulwilcox/fluent-data/wiki/The-Future).




































