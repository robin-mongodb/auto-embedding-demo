> For the complete MongoDB documentation index, see www.mongodb.com/docs/llms.txt

# Views

A MongoDB view is a read-only queryable object whose contents are defined by an [aggregation pipeline](/docs/manual/core/aggregation-pipeline#std-label-aggregation-pipeline) on other collections or views.

MongoDB does not persist the view contents to disk. A view's content is computed on-demand when a client queries the view.

**Note: Disambiguation**

This page discusses standard views. For discussion of on-demand materialized views, see [On-Demand Materialized Views.](/docs/manual/core/materialized-views#std-label-manual-materialized-views)

To understand the differences between the view types, see [Comparison with On-Demand Materialized Views.](/docs/manual/core/views#std-label-view-materialized-view-compare)

You can [create materialized views in the UI](/docs/manual/core/materialized-views#std-label-create-view-atlas) for deployments hosted in [MongoDB Atlas.](https://www.mongodb.com/docs/atlas)

## Use Cases

You can use views to:

- Create a view on a collection of employee data to exclude any personally identifiable information (PII).

- Create a view on a collection of sensor data to add computed fields and metrics.

- Create a view that joins two collections containing inventory and order history. Your application can query the view without managing or understanding the underlying pipeline.

- Create a MongoDB Search or MongoDB Vector Search index on a view to partially index a collection, support incompatible data types or data models, and more. To learn more, see [Use Views with MongoDB Search](https://www.mongodb.com/docs/search/about/view-support/#std-label-fts-transform-documents-collections) and [Use Views with MongoDB Vector Search.](https://www.mongodb.com/docs/vector-search/query/view-support/#std-label-avs-transform-documents-collections)

## Create and Manage Views

To learn how to create and manage views, see the following resources:

- [Manage Views in Atlas](https://www.mongodb.com/docs/atlas/atlas-ui/views/#std-label-atlas-ui-views)

- [Create and Query a View](/docs/manual/core/views/create-view#std-label-manual-views-create)

- [Use a View to Join Two Collections](/docs/manual/core/views/join-collections-with-view#std-label-manual-views-lookup)

- [Create a View with Default Collation](/docs/manual/core/views/specify-collation#std-label-manual-views-collation)

- [Modify or Remove a View](/docs/manual/core/views/update-view#std-label-manual-views-modify)

- [Modify or Remove a View](/docs/manual/core/views/update-view#std-label-manual-views-remove)

## Comparison with On-Demand Materialized Views

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

## Behavior

### Read Only

Views are read-only. Write operations on views return an error.

### Snapshot Isolation

Views do not maintain timestamps of collection changes and do not support point-in-time or snapshot read isolation.

### View Pipelines

The view's underlying aggregation pipeline is subject to the 100 megabyte memory limit for blocking sort and blocking group operations.

Pipeline stages that require more than 100 megabytes of memory to execute write temporary files to disk by default. These temporary files last for the duration of the pipeline execution and can influence storage space on your instance.

Individual `find` and `aggregate` commands can override the [`allowDiskUseByDefault`](/docs/manual/reference/parameters#mongodb-parameter-param.allowDiskUseByDefault) parameter by either:

- Using `{ allowDiskUse: true }` to allow writing temporary files out to disk when `allowDiskUseByDefault` is set to `false`

- Using `{ allowDiskUse: false }` to prohibit writing temporary files out to disk when `allowDiskUseByDefault` is set to `true`

**Note:**

For MongoDB Atlas, it is recommended to [configure storage auto-scaling](https://www.mongodb.com/docs/atlas/cluster-autoscaling/#std-label-cluster-autoscaling) to prevent long-running queries from filling up storage with temporary files.

If your Atlas cluster uses storage auto-scaling, the temporary files may cause your cluster to scale to the next storage tier.

### Time Series Collections

[Time series collections](/docs/manual/core/timeseries-collections#std-label-manual-timeseries-collection) are writable non-materialized views. Limitations for views apply to time series collections. For more information, see [Time Series Collection Limitations.](/docs/manual/core/timeseries/timeseries-limitations#std-label-manual-timeseries-collection-limitations)

## Access Control

If the deployment enforces [authentication:](/docs/manual/core/authentication#std-label-authentication)

- To create a view, you must have the [`createCollection`](/docs/manual/reference/privilege-actions#mongodb-authaction-createCollection) privilege on the database that the view is created. Additionally, if you have the [`find`](/docs/manual/reference/privilege-actions#mongodb-authaction-find) privilege on the namespace of the view you want to create, you must also have the `find` privilege on the following resources:
  - The source collection or view from which the new view is created.

  - Any collections or views referenced in the [view pipeline.](/docs/manual/core/views#std-label-views-pipelines)

- To query a view, you must have the `find` privilege on the view namespace. You don't need the `find` privilege on the source collection or any namespaces referenced in the view pipeline.

A user with the built-in [`readWrite`](/docs/manual/reference/built-in-roles#mongodb-authrole-readWrite) role on the database has the required privileges to run the listed operations. To grant the required permissions, either:

- [Create a user](/docs/manual/tutorial/create-users#std-label-create-users) with the required role.

- [Grant the role to an existing user.](/docs/manual/tutorial/manage-users-and-roles#std-label-modify-existing-user-access)
