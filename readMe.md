# OneQuery

Work with data structures in regular javascript and indexedDb using the same API.  Intermingling Javascript and indexedDb is possible.

## Datasets

A dataset is an array of objects with named properties, such as:

    let students = [
        { id: "a", name: "Andrea" },
        { id: "b", name: "Becky" },
        { id: "c", name: "Colin" }
    ],

or 

    let scores = [
        {id: 1, student: "a", score: 5 },
        {id: 2, student: "b", score: 7 },
        {id: 3, student: "c", score: 10 },
        {id: 4, student: "a", score: 0 },
        {id: 5, student: "b", score: 6 },
        {id: 6, student: "c", score: 9 }
    ].

OneQuery can work with plain-old-javascript structures such as above.  It can also work with IndexedDB tables.  *A goal in the future is to get it to work with server-side persistence from Node.js.*

For consistency with example/data.js, we will create a single "database" object to house our datasets, though this is by no means necessary:

    let datasets = { students, scores }.

## Instantiation

The oneQuery class can be instantiated in the following ways:

    new oneQuery()
    new oneQuery('persistenceDatabaseName', 'persistenceType')  
    $$() 
    $$('persistenceDatabaseName', 'persistenceType').

*Presently, only 'idb' is supported as a persistence type.*

## Loading Datasets

You will immediately want to load your class with the datasets you want to work with:

    $$()
    .from({
        st: datasets.students,
        sc: datasets.scores
    }).

The oneQuery instance will now load the datasets for *students* and *scores* into *st* and *sc*, respectively.  All future operations within oneQuery will make reference to these new aliases, unless an operation modifies or deletes a store alias. 

### IndexedDB 

If you want to load from an objectStore in IndexedDb, then you have two options:

    $$('idbDatabaseName', 'idb').from({x: 'datasetName'}),
    $$().from({x: oneQuery.idbSource('storeName', idbPromise)}).

The former is more convenient for loading multiple datasets from the same IndexedDB source.  The latter is there if you need to load from multiple IndexedDB sources.

## Syntax

Operations on OneQuery datasets typically involve arrow functions inside chained method calls.  The parameters of the arrow functions are taken to refer to the object aliases of the loaded datasets.  Consider, for instance:

    $$()
    .from({
        sc: sampleDataSets.scores,
        st: sampleDataSets.students 
    })
    .filter(sc => sc.score != 0) // fixme: one reason this is not yet a stable release
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
    .print(tm => tm, "#someHtmlDivId", "oneQuery Result Js") 
    .map(tm => tm);

Which, due to **print**, will display:

![Results](./example/javascript.png).

*sc* and *sc* in the **join** method reference the respective datasets loaded in the **from** method.  What results is a single dataset, though it's properties are still tracked to their original aliases.  In the first use of **map**, the joined store is renamed to *tm*.  So further references to data must point instead to *tm*, as they do in **print** and the second use of **map**.  

### Chaining and the "End Of The Line"

If use of a method indicates that more operations are expected, then the oneQuery class itself is returned in fluent fashion.  This allows chaining of further methods to add more commands to the process.  This is what is happending with the first use of **map** above, as well as all the other method uses.

If use of a method indicates that no further operations are desired by the user, then the result of the method is returned, which is a transformed dataset.  This is what is happening with the final use of **map** above (it is not being mapped into any store, so it must be that the user now wants the output).

### Returning Promises or Plain Javascript

When an end-of-the line value is returned, it can either be a promise, or a plain javascript dataset.  It returns a promise if at any point in processing the data involves a promise (such as with joining with or sourcing from an IndexedDb object store).  Otherwise, a plain javascript dataset is returned.

If no promises are involved, then most execution is deferred until the end of the line.  

## Operations

The following operations are available on oneQuery:

**filter**: Filter a dataset.  Works just like 'filter' in standard javascript, except that the arrow function parameter must match a loaded store alias. 

**join**: Horizontally join two datasets.  Can do inner, left, right, and full joins.  Documentation on that will be added later.  Ability to do hash vs loop joins is just around the corner.  The code is complete, but it is not yet integrated into the API.

**orderBy**: Order a dataset.  In the arrow function, return an array of values.  The ordering will occur stepwise based on the order of values in the array.  This is syntactically more pleasant than the 'orderBy().thenBy()' approach in c# linq.

**groupBy**: Group rows of a dataset.  Can be done in advance of aggregation, or can just be there to create nesting in the dataset.  In the arrow function, you can return a simple value as above, but you can also return an object with named properties, which will group based on mutiple criteria.

**map**: Map a dataset.  Works similar to 'map' in standard javascript, except that the arrow function parameter must match a loaded store alias.  A single arrow function as a parameter will mark the end-of-the line and in consequence return the mapped dataset.   

**print**: Show a dataset as an html table.  The first parameter is an arrow function that maps what is to be output.  Can be a little quirky, be sure to only print from a single source (joined datasets count as a single source).  The second parameter is the div to put the html table into.  The third parameter is a caption for the table.  The table is quite versatile.  It can accomoadate different object types, has paging, and so on.  Inspired by LinqPad visualizations, but of course quite different.

**fold**: Aggregate or otherwise condense a dataset.  More documentation to come on this.

**merge**: Merge values from one dataset into another.  Inspired by slowly-changing-dimension approach.  More documentation to come on this.

**executeAll**: Hopefully this won't be necessary in the future.  But in some cases, the end-of-the line is not reached, yet processing of all non-promise datasets is required.  This method has no parameters.  It will still return the oneQuery object.

## Example

Web pages for a sample server are included in the 'example' folder.  Use webpack-dev-server or other means to see the results.  Otherwise, just skim the html files to get a sense of the usage.   

## Newbie Disclaimers

I come from a sql and c# background, and I have not had any experience using a public Github account.  Bear with me in the early stages of this project.  When things get more stable, I'll bump the major version to '1' and from that point begin utilizing semver.  

