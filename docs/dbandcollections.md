> For the complete MongoDB documentation index, see www.mongodb.com/docs/llms.txt

<!--
Tab options on this page. Append to the .md URL to filter:
  ?tabs=<id,...>   select specific tabs (e.g. ?tabs=nodejs,shell)
  ?allTabs=true    include every tab
  (no param)       default: one tab per tabset

Available tabs:
  other tabs: atlas, mongosh, compass
-->

# Databases and Collections in MongoDB

MongoDB stores data records as [documents](/docs/manual/reference/glossary#std-term-document) ([BSON documents](/docs/manual/core/document#std-label-bson-document-format)) in [collections](/docs/manual/reference/glossary#std-term-collection). A [database](/docs/manual/reference/glossary#std-term-database) holds one or more collections.

You can manage [databases](https://www.mongodb.com/docs/atlas/atlas-ui/databases/) and [collections](https://www.mongodb.com/docs/atlas/atlas-ui/collections/) using the Atlas UI, [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh), or MongoDB Compass. This page covers Atlas UI procedures. For self-managed deployments, use [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh) or MongoDB Compass.

Select your client:

### Atlas UI

## Databases

### Atlas UI

Log in to Atlas and go to the Data Explorer page for your project.

1. Select your organization and project

   If it's not already displayed, select the organization that contains your project from the Organizations menu in the navigation bar.

   If it's not already displayed, select your project from the Projects menu in the navigation bar.

2. Open the Data Explorer

   In the sidebar, click Data Explorer under the Database heading.

   The Data Explorer displays.

### Create a Database

### Atlas UI

1. In MongoDB Atlas, go to the Data Explorer page for your project

   If it's not already displayed, select the organization that contains your project from the Organizations menu in the navigation bar.

   If it's not already displayed, select your project from the Projects menu in the navigation bar.

   In the sidebar, click Data Explorer under the Database heading.

   The [Data Explorer](https://cloud.mongodb.com/go?l=https%3A%2F%2Fcloud.mongodb.com%2Fv2%2F%3Cproject%3E%23%2Fmetrics%2FreplicaSet%2F%3Creplset%3E%2Fexplorer) displays.

2. Open the Create Database dialog box

   In the Connections sidebar, select or hover over your cluster and click the icon to open the Create Database dialog box.

3. Enter the Database Name and the Collection Name

   Enter the Database Name and the Collection
   Name to create the database and its first collection.

   If you want to use [custom collation](https://www.mongodb.com/docs/manual/reference/collation/#collation-document) on the collection, select the Use Custom Collation checkbox and select the desired collation settings.

   **Important:**

   Don't include [sensitive information](https://www.mongodb.com/docs/atlas/production-notes/#std-label-sensitive-info) in your database and collection names.

   For more information on MongoDB database names and collection names, see [Naming Restrictions.](/docs/manual/reference/limits#std-label-restrictions-on-db-names)

4. Optional. Specify a time series collection

   Select whether the collection is a [time series collection](https://www.mongodb.com/docs/manual/core/timeseries-collections/). If you select to create a time series collection, specify the time field and granularity. You can optionally specify the meta field and the time for old data in the collection to expire.

5. Click Create Database

   Upon successful creation, the database and the collection appears in the Connections sidebar.

## Collections

MongoDB stores documents in collections. Collections are analogous to tables in relational databases.

![A collection of MongoDB documents.](/images/crud-annotated-collection.bakedsvg.svg)

### Create a Collection

If a collection does not exist, MongoDB creates the collection when you first store data for that collection.

### Atlas

1. In MongoDB Atlas, go to the Data Explorer page for your project

   If it's not already displayed, select the organization that contains your project from the Organizations menu in the navigation bar.

   If it's not already displayed, select your project from the Projects menu in the navigation bar.

   In the sidebar, click Data Explorer under the Database heading.

   The [Data Explorer](https://cloud.mongodb.com/go?l=https%3A%2F%2Fcloud.mongodb.com%2Fv2%2F%3Cproject%3E%23%2Fmetrics%2FreplicaSet%2F%3Creplset%3E%2Fexplorer) displays.

2. Open the Create Collection dialog box.

   Select or hover over the database, and click the icon to open the Create Collection dialog box.

3. Enter the Collection Name.

   In the Create Collection dialog box, enter the name of the collection you want to create.

   MongoDB Atlas also provides Additional preferences. You can choose from the following options:
   - Create a Clustered Collection

   - Create a Collection with Collation

   **Important:**

   Don't include [sensitive information](https://www.mongodb.com/docs/atlas/production-notes/#std-label-sensitive-info) in your collection name.

   For more information on MongoDB collection names, see [Naming Restrictions.](/docs/manual/reference/limits#std-label-restrictions-on-db-names)

4. Optional. Specify a time series collection.

   Select whether the collection is a [time series collection](https://www.mongodb.com/docs/manual/core/timeseries-collections/). If you select to create a time series collection, specify the time field and granularity. You can optionally specify the meta field and the time for old data in the collection to expire.

5. Click Create Collection.

   Upon successful creation, the collection appears underneath the database in the Connections sidebar.

### Atlas

### Schema Validation

By default, documents in a collection do not share a schema. Fields and data types can vary across documents.

You can enforce [schema validation rules](/docs/manual/core/schema-validation#std-label-schema-validation-overview) during insert and update operations.

For MongoDB Atlas deployments, the [Performance Advisor](https://www.mongodb.com/docs/atlas/performance-advisor/#std-label-performance-advisor) and the MongoDB Atlas UI detect common schema design issues and suggest modifications that follow MongoDB best practices. To learn more, see [Schema Suggestions.](https://www.mongodb.com/docs/atlas/performance-advisor/schema-suggestions/#schema-suggestions)

### Modifying Document Structure

To add, remove, or retype fields in a collection's documents, update the existing documents.

### Unique Identifiers

Collections are assigned an immutable UUID (Universally unique identifier) that remains consistent across all replica set members and shards.

### Atlas
