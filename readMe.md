## Announcement(s)

Version 2.3.2 has many under-the-hood changes preparing for a new set of features.  But the reason
It's been verioned-up and published to npm right now is that I'm testing some package.json settings
so that certain folders are included in github but not npmjs.

Version 2.2.0 allows multiple regression.  

Version 2.3.0 allows covariance and correlation matricies

Be on the lookout for release of a matrix object and of the capacity for factor analysis with rotation.  

## Summary 

Manipulate datasets and perform statistics by chaining methods.  Includes capacity to map, filter, sort, group, reduce, and merge data.  
Built in reducers includes multiple regression.  

`fluent-data` works like many of the methods on `Array.prototype`.  However, fluent-data makes it much easier to work with arrays when their elements are objects.  It also includes methods simply not available on `Array.prototype`.   

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

### Example:

Consider these datasets:

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

The following exmaple uses many of the methods available to analyze the two datasets.

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

    console.log(result);


[--]: # ()

This results in three rows for analysis:

[--]: # (output=true)

    [
      {
        customer: 'Alice',
        store: 2,
        speed: 1.33,
        rating: 94.67,
        correlation: -0.5
      },
      {
        customer: 'Alice',
        store: 1,
        speed: 12.33,
        rating: 60,
        correlation: -0.8315708645692353
      },
      {
        customer: 'Benny',
        store: 1,
        speed: 8.33,
        rating: 75.33,
        correlation: -0.9853292781642932
      }
    ]

[--]: # ()

## Operations and Features

The following operations are available on fluent-data:

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

Click on the links to go to the wiki and learn more about them.

To see possible directions for this library, go to [The-Future](https://github.com/paulwilcox/fluent-data/wiki/The-Future).
