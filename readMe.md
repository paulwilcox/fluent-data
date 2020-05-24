Manipulate datasets by chaining methods.  Includes capacity to map, filter, sort, group, reduce, and merge data.  

`fluent-data` works like many of the methods on `Array.prototype`.  However, fluent-data makes it much easier to work with arrays when their elements are objects.  It also includes methods simply not available on `Array.prototype`.   

`fluent-data` syntax is similar to LINQ in c#.  C# developers frustrated with the lack of a LINQ functionality in javascript may be encouraged by fluent-data.  Some of the syntax can even be friendlier and more powerful in comparison.   

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
        .reduce(p => ({
            customer: $$.first(p.name),
            store: $$.first(p.storeId),
            orders: $$.count(p.id), 
            speed: $$.avg(p.speed),
            rating: $$.avg(p.rating),
            correlation: $$.cor(p.speed, p.rating)
        }))
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

* [get](https://github.com/paulwilcox/FluentDB/wiki/Map-and-Get#Getting): Returns the dataset as an array.
* [map](https://github.com/paulwilcox/FluentDB/wiki/Map-and-Get#Mapping): Replaces each row in a dataset with the result of 
  a function called on each row. 
* [filter](https://github.com/paulwilcox/FluentDB/wiki/Filtering): Chooses particular rows from a dataset. 
* [sort](https://github.com/paulwilcox/FluentDB/wiki/Sorting): Sorts a dataset.  
* [distinct](https://github.com/paulwilcox/FluentDB/wiki/Distinct): Eliminates duplicates in a dataset.
* [merge](https://github.com/paulwilcox/FluentDB/wiki/Merging): Brings in values from another set of data.  Can be done 
  horizontally (such as with a join) or vertically (such as with an insert).
* [group](https://github.com/paulwilcox/FluentDB/wiki/Grouping): Group rows of a dataset into nested datasets.  Or reverse 
  this with [ungroup](https://github.com/paulwilcox/FluentDB/wiki/Grouping#Ungrouping-Rows)
* [reduce](https://github.com/paulwilcox/FluentDB/wiki/Reducing): Aggregate a dataset.  Create custom aggregators with 
  [reducer](https://github.com/paulwilcox/FluentDB/wiki/Reducing#Simple-Custom-Reducers).
* [with](https://github.com/paulwilcox/FluentDB/wiki/With): Work with a dataset without breaking the fluency/chaining
  syntax. 

Click on the links to go to the wiki and learn more about them.
