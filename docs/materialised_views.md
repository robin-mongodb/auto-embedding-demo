> For the complete MongoDB documentation index, see www.mongodb.com/docs/llms.txt

# On-Demand Materialized Views

**Note: Disambiguation**

This page discusses on-demand materialized views. For discussion of standard views, see [Views.](/docs/manual/core/views#std-label-views-landing-page)

To understand the differences between the view types, see [Comparison with Standard Views.](/docs/manual/core/materialized-views#std-label-materialized-view-compare)

An on-demand materialized view is a pre-computed aggregation pipeline result that is stored on and read from disk. On-demand materialized views are typically the results of a [`$merge`](/docs/manual/reference/operator/aggregation/merge#mongodb-pipeline-pipe.-merge) or [`$out`](/docs/manual/reference/operator/aggregation/out#mongodb-pipeline-pipe.-out) stage.

## Comparison with Standard Views

MongoDB provides two different view types: **standard views** and **on-demand materialized views**. Both view types return the results from an aggregation pipeline.

- Standard views are computed when you read the view, and are not stored to disk.

- On-demand materialized views are stored on and read from disk. They use a [`$merge`](/docs/manual/reference/operator/aggregation/merge#mongodb-pipeline-pipe.-merge) or [`$out`](/docs/manual/reference/operator/aggregation/out#mongodb-pipeline-pipe.-out) stage to update the saved data.

  **Note:**

  When using [`$merge`](/docs/manual/reference/operator/aggregation/merge#mongodb-pipeline-pipe.-merge), you can use [change streams](/docs/manual/changeStreams#std-label-changeStreams) to watch for changes on the materialized view. When using [`$out`](/docs/manual/reference/operator/aggregation/out#mongodb-pipeline-pipe.-out), you can't watch for changes on the materialized view.

### Indexes

Standard views use the indexes of the underlying collection. As a result, you cannot create, drop or re-build general indexes on a standard view directly, nor get a list of general indexes on the view.

MongoDB stores search indexes and vector search indexes on disk. Accordingly, you can create [MongoDB Search indexes](https://www.mongodb.com/docs/atlas/atlas-search/transform-documents-collections/) and [MongoDB Vector Search indexes](https://www.mongodb.com/docs/atlas/atlas-vector-search/transform-documents-collections/) on compatible views that contain only the following stages:

- [`$addFields`](/docs/manual/reference/operator/aggregation/addFields#mongodb-pipeline-pipe.-addFields)

- [`$set`](/docs/manual/reference/operator/aggregation/set#mongodb-pipeline-pipe.-set)

- [`$match`](/docs/manual/reference/operator/aggregation/match#mongodb-pipeline-pipe.-match) wrapping an [`$expr`](/docs/manual/reference/operator/query/expr#mongodb-query-op.-expr) operation

You can also create indexes directly on on-demand materialized views because MongoDB stores those indexes on disk.

### Performance

On-demand materialized views provide better read performance than standard views because they are read from disk instead of computed as part of the query. This performance benefit increases based on the complexity of the pipeline and size of the data being aggregated.

On MongoDB Atlas, Atlas Stream Processing can also maintain a streaming materialized view that updates continuously as source data changes. To learn more, see [Streaming Materialized Views.](https://www.mongodb.com/docs/atlas/atlas-stream-processing/streaming-materialized-views/)

## Create a Materialized View in the MongoDB Atlas UI

The example in this section uses the [sample training dataset](https://www.mongodb.com/docs/atlas/sample-data/sample-training/). To learn how to load the sample dataset into your MongoDB Atlas deployment, see [Load Sample Data.](https://www.mongodb.com/docs/atlas/sample-data/#std-label-load-sample-data)

To create a materialized view in the MongoDB Atlas UI, follow these steps:

1. In the MongoDB Atlas UI, go to the Clusters page for your project.

   If it's not already displayed, select the organization that contains your desired project from the Organizations menu in the navigation bar.

   If it's not already displayed, select your project from the Projects menu in the navigation bar.

   In the sidebar, click Clusters under the Database heading.

   The [Clusters](https://cloud.mongodb.com/go?l=https%3A%2F%2Fcloud.mongodb.com%2Fv2%2F%3Cproject%3E%23%2Fclusters) page displays.

2. Navigate to the collection

   For the cluster that contains the sample data, click Browse Collections.

   In the left navigation pane, select the sample_training database.

   Select the grades collection.

3. Click the Aggregation tab

4. Click Add Stage

5. Select an aggregation stage from the Select drop-down menu

   The aggregation stage transforms the data that you want to save as a view. To learn more about available aggregation stages, see [Aggregation Stages.](/docs/manual/reference/mql/aggregation-stages#std-label-aggregation-pipeline-operator-reference)

   For this example, add a new field with the [`$set`](/docs/manual/reference/operator/aggregation/set#mongodb-pipeline-pipe.-set) stage:

   Select [`$set`](/docs/manual/reference/operator/aggregation/set#mongodb-pipeline-pipe.-set) from the Select drop-down menu.

   Add the following syntax to the aggregation pipeline editor to create an average score across all `score` values in the `scores` array within the `grades` collection:

   ```javascript
   {
     averageScore: {
       $avg: "$scores.score";
     }
   }
   ```

   MongoDB Atlas adds the `averageScore` value to each document.

6. Click Add Stage

7. Add the `$out` stage

   Select the [`$out`](/docs/manual/reference/operator/aggregation/out#mongodb-pipeline-pipe.-out) stage from the Select drop-down menu.

   Add the following syntax to the aggregation pipeline to write the results of the pipeline to the `myView` collection in the `sample_training` database:

   ```javascript
   "myView";
   ```

   Click Save Documents.

   The [`$out`](/docs/manual/reference/operator/aggregation/out#mongodb-pipeline-pipe.-out) stage writes the results of the aggregation pipeline to the specified collection, which creates the view. To learn more, see [`$out`.](/docs/manual/reference/operator/aggregation/out#mongodb-pipeline-pipe.-out)

   Refresh the list of collections to see the `myView` collection.

   To learn how to query the `myView` collection in the MongoDB Atlas UI, see [View, Filter, and Sort Documents](https://www.mongodb.com/docs/atlas/atlas-ui/documents/#view--filter--and-sort-documents) in the MongoDB Atlas documentation.

## Example

The example uses the `movies` collection from the [sample_mflix](https://www.mongodb.com/docs/atlas/sample-data/sample-mflix/) dataset. To learn how to load sample data, see [Load Sample Data.](https://www.mongodb.com/docs/atlas/sample-data/#std-label-load-sample-data)

### 1. Define the On-Demand Materialized View

The following `updateMovieStats` function defines a `movieYearStats` materialized view that contains the count and average IMDb rating of movies by year. The function accepts a `startYear` parameter to update statistics for movies released from that year forward.

```javascript
updateMovieStats = function (startYear) {
  db.movies.aggregate([
    { $match: { year: { $gte: startYear } } },
    {
      $group: {
        _id: "$year",
        movieCount: { $sum: 1 },
        avgRating: { $avg: "$imdb.rating" },
      },
    },
    { $merge: { into: "movieYearStats", whenMatched: "replace" } },
  ]);
};
```

- The [`$match`](/docs/manual/reference/operator/aggregation/match#mongodb-pipeline-pipe.-match) stage filters movies to process only those with a `year` value greater than or equal to `startYear`.

- The [`$group`](/docs/manual/reference/operator/aggregation/group#mongodb-pipeline-pipe.-group) stage groups movies by `year`. The documents output by this stage have the form:

  ```javascript
  { "_id" : <year>, "movieCount" : <num>, "avgRating" : <num> }
  ```

- The [`$merge`](/docs/manual/reference/operator/aggregation/merge#mongodb-pipeline-pipe.-merge) stage writes the output to the `movieYearStats` collection.

  The stage matches [on](/docs/manual/reference/operator/aggregation/merge#std-label-merge-on) the `_id` field and checks if each aggregation result [matches](/docs/manual/reference/operator/aggregation/merge#std-label-merge-whenMatched) an existing document:
  - [When there is a match](/docs/manual/reference/operator/aggregation/merge#std-label-merge-whenMatched) (that is, a document with the same year already exists in the collection), the stage [replaces the existing document](/docs/manual/reference/operator/aggregation/merge#std-label-merge-whenMatched-replace) with the document from the aggregation results.

  - [When there isn't a match](/docs/manual/reference/operator/aggregation/merge#std-label-merge-whenNotMatched), the stage inserts the document from the aggregation results into the collection (the default behavior when not matched).

### 2. Perform Initial Run

For the initial run, pass in a starting year to populate `movieYearStats` with data from that year forward:

```javascript
updateMovieStats(2015);
```

After the initial run, `db.movieYearStats.find().sort( { _id: 1 } )` returns documents like the following:

```javascript
{ "_id" : 2015, "movieCount" : <num>, "avgRating" : <num> }
{ "_id" : 2016, "movieCount" : <num>, "avgRating" : <num> }
{ "_id" : 2017, "movieCount" : <num>, "avgRating" : <num> }
```

### 3. Refresh Materialized View

Assume a new movie is added to the `movies` collection for 2016:

```javascript
db.movies.insertOne({
  title: "Grove Test Movie",
  year: 2016,
  imdb: { rating: 7.5, votes: 500 },
});
```

To refresh `movieYearStats` for 2016 onward, run the function with a `startYear` of `2016`:

```javascript
updateMovieStats(2016);
```

The updated `movieYearStats` reflects the new movie in the `movies` collection. `db.movieYearStats.find().sort( { _id: 1 } )` returns:

```javascript
{ "_id" : 2015, "movieCount" : <num>, "avgRating" : <num> }
{ "_id" : 2016, "movieCount" : <num>, "avgRating" : <num> }
{ "_id" : 2017, "movieCount" : <num>, "avgRating" : <num> }
```

## Additional Information

The [`$merge`](/docs/manual/reference/operator/aggregation/merge#mongodb-pipeline-pipe.-merge) stage:

- Can output to a collection in the same or different database.

- Creates a new collection if the output collection does not already exist.

- Can incorporate results (insert new documents, merge documents, replace documents, keep existing documents, fail the operation, process documents with a custom update pipeline) into an existing collection.

- Can output to a sharded collection. Input collection can also be sharded.

See [`$merge`](/docs/manual/reference/operator/aggregation/merge#mongodb-pipeline-pipe.-merge) for:

- More information on [`$merge`](/docs/manual/reference/operator/aggregation/merge#mongodb-pipeline-pipe.-merge) and available options

- Example: [On-Demand Materialized View: Initial Creation](/docs/manual/reference/operator/aggregation/merge#std-label-merge-mat-view-init-creation)

- Example: [On-Demand Materialized View: Update/Replace Data](/docs/manual/reference/operator/aggregation/merge#std-label-merge-mat-view-refresh)

- Example: [Only Insert New Data](/docs/manual/reference/operator/aggregation/merge#std-label-merge-mat-view-insert-only)
