> For the complete MongoDB documentation index, see www.mongodb.com/docs/llms.txt

# Create and Query a View

To create a view, use one of the following methods:

- Use [`db.createCollection()`](/docs/manual/reference/method/db.createCollection#mongodb-method-db.createCollection)

- Use [`db.createView()`](/docs/manual/reference/method/db.createView#mongodb-method-db.createView)

To create a view in the MongoDB Atlas UI, use the [Aggregation Pipeline Builder](https://www.mongodb.com/docs/atlas/atlas-ui/create-agg-pipeline/#std-label-atlas-ui-agg-builder). To learn more, see [Manage Views in Atlas.](https://www.mongodb.com/docs/atlas/atlas-ui/views/#std-label-atlas-ui-views)

**Important: View Names are Included in Collection List Output**

Operations that list collections, such as [`db.getCollectionInfos()`](/docs/manual/reference/method/db.getCollectionInfos#mongodb-method-db.getCollectionInfos) and [`db.getCollectionNames()`](/docs/manual/reference/method/db.getCollectionNames#mongodb-method-db.getCollectionNames), include views in their outputs.

The view definition is public; i.e. [`db.getCollectionInfos()`](/docs/manual/reference/method/db.getCollectionInfos#mongodb-method-db.getCollectionInfos) and `explain` operations on the view will include the pipeline that defines the view. As such, avoid referring directly to sensitive fields and values in view definitions.

## `db.createCollection()` Syntax

```javascript
db.createCollection(
  "<viewName>",
  {
    "viewOn" : "<source>",
    "pipeline" : [<pipeline>],
    "collation" : { <collation> }
  }
)
```

## `db.createView()` Syntax

```javascript
db.createView(
  "<viewName>",
  "<source>",
  [<pipeline>],
  {
    "collation" : { <collation> }
  }
)
```

## Restrictions

- You must create views in the same database as the source collection.

- A view definition `pipeline` cannot include the [`$out`](/docs/manual/reference/operator/aggregation/out#mongodb-pipeline-pipe.-out) or the [`$merge`](/docs/manual/reference/operator/aggregation/merge#mongodb-pipeline-pipe.-merge) stage. This restriction also applies to embedded pipelines, such as pipelines used in [`$lookup`](/docs/manual/reference/operator/aggregation/lookup#mongodb-pipeline-pipe.-lookup) or [`$facet`](/docs/manual/reference/operator/aggregation/facet#mongodb-pipeline-pipe.-facet) stages.

- You cannot rename a view once it is created.

### Unsupported Operations

Some operations are not available with views:

- [`db.collection.mapReduce()`.](/docs/manual/reference/method/db.collection.mapReduce#mongodb-method-db.collection.mapReduce)

- [`$text`](/docs/manual/reference/operator/query/text#mongodb-query-op.-text) operator, since `$text` in aggregation is valid only for the first stage.

- Renaming a view.

For more information, see [Supported Operations for Views.](/docs/manual/core/views/supported-operations#std-label-views-supported-operations)

## Examples

### Populate the Collection

Create a `students` collection to use for this example:

```javascript
db.students.insertMany([
  { sID: 22001, name: "Alex", year: 1, score: 4.0 },
  { sID: 21001, name: "bernie", year: 2, score: 3.7 },
  { sID: 20010, name: "Chris", year: 3, score: 2.5 },
  { sID: 22021, name: "Drew", year: 1, score: 3.2 },
  { sID: 17301, name: "harley", year: 6, score: 3.1 },
  { sID: 21022, name: "Farmer", year: 1, score: 2.2 },
  { sID: 20020, name: "george", year: 3, score: 2.8 },
  { sID: 18020, name: "Harley", year: 5, score: 2.8 },
]);
```

### Use db.createView() to Create a View

```javascript
db.createView("firstYears", "students", [{ $match: { year: 1 } }]);
```

In the example:

- `firstYears` is the name of the new view.

- `students` is the collection the view is based on.

- [`$match`](/docs/manual/reference/operator/aggregation/match#mongodb-pipeline-pipe.-match) is an aggregation expression that matches first year students in the `students` collection.

#### Query the View

```javascript
db.firstYears.find({}, { _id: 0 });
```

The `{ _id: 0 }` [projection](/docs/manual/reference/method/db.collection.find#std-label-method-find-projection) suppresses the `_id` field in the output.

```javascript
[
  { sID: 22001, name: "Alex", year: 1, score: 4 },
  { sID: 22021, name: "Drew", year: 1, score: 3.2 },
  { sID: 21022, name: "Farmer", year: 1, score: 2.2 },
];
```

**Note: Projection Restrictions**

[`find()`](/docs/manual/reference/method/db.collection.find#mongodb-method-db.collection.find) operations on views do not support the following [find command projection operators:](/docs/manual/reference/mql/projection#std-label-projection-operators-ref)

- [`$`](/docs/manual/reference/operator/projection/positional#mongodb-projection-proj.-)

- [`$elemMatch`](/docs/manual/reference/operator/projection/elemMatch#mongodb-projection-proj.-elemMatch)

- [`$slice`](/docs/manual/reference/operator/projection/slice#mongodb-projection-proj.-slice)

- [`$meta`](/docs/manual/reference/operator/aggregation/meta#mongodb-expression-exp.-meta)

### Use db.createCollection() to Create a View

The [`db.createCollection()`](/docs/manual/reference/method/db.createCollection#mongodb-method-db.createCollection) method allows you to create a collection or a view with specific options.

The following example creates a `graduateStudents` view. The view only contains documents selected by the [`$match`](/docs/manual/reference/operator/aggregation/match#mongodb-pipeline-pipe.-match) stage. The optional [collation](/docs/manual/reference/collation#std-label-collation) setting determines the sort order.

```javascript
db.createCollection("graduateStudents", {
  viewOn: "students",
  pipeline: [{ $match: { year: { $gt: 4 } } }],
  collation: { locale: "en", caseFirst: "upper" },
});
```

**Note: Collation Behavior**

- You can specify a default [collation](/docs/manual/reference/collation#std-label-collation) for a view at creation time. If no collation is specified, the view's default collation is the "simple" binary comparison collator. That is, the view does not inherit the collection's default collation.

- String comparisons on the view use the view's default collation. An operation that attempts to change or override a view's default collation will fail with an error.

- If creating a view from another view, you cannot specify a collation that differs from the source view's collation.

- If performing an aggregation that involves multiple views, such as with [`$lookup`](/docs/manual/reference/operator/aggregation/lookup#mongodb-pipeline-pipe.-lookup) or [`$graphLookup`](/docs/manual/reference/operator/aggregation/graphLookup#mongodb-pipeline-pipe.-graphLookup), the views must have the same [collation.](/docs/manual/reference/collation#std-label-collation)

#### Query the View

The following example queries the view. The [`$unset`](/docs/manual/reference/operator/aggregation/unset#mongodb-pipeline-pipe.-unset) stage removes the `_id` field from the output for clarity.

```javascript
db.graduateStudents.aggregate([{ $sort: { name: 1 } }, { $unset: ["_id"] }]);
```

When the output is sorted, the [`$sort`](/docs/manual/reference/operator/aggregation/sort#mongodb-pipeline-pipe.-sort) stage uses the [collation](/docs/manual/reference/collation#std-label-collation) ordering to sort uppercase letters before lowercase letters.

```javascript
[
  { sID: 18020, name: "Harley", year: 5, score: 2.8 },
  { sID: 17301, name: "harley", year: 6, score: 3.1 },
];
```

### Retrieve Medical Information for Roles Granted to the Current User

Starting in MongoDB 7.0, you can use the new [`USER_ROLES`](/docs/manual/reference/aggregation-variables#mongodb-variable-variable.USER_ROLES) system variable to return user [roles.](/docs/manual/core/authorization#std-label-roles)

**Note:**

Using the [`USER_ROLES`](/docs/manual/reference/aggregation-variables#mongodb-variable-variable.USER_ROLES) system variable in aggregations is not supported in [M0 and Flex clusters.](https://www.mongodb.com/docs/atlas/unsupported-commands/#limited-commands)

The example in this section shows users with limited access to fields in a collection containing medical information. The example uses a view that reads the current user roles from the `USER_ROLES` system variable and hides fields based on the roles.

The example creates these users:

- `James` with a `Billing` role who can access a `creditCard` field.

- `Michelle` with a `Provider` role who can access a `diagnosisCode` field.

Perform the following steps to create the roles, users, collection, and view:

1. Create the roles

   Run:

   ```javascript
   db.createRole({
     role: "Billing",
     privileges: [
       {
         resource: { db: "test", collection: "medicalView" },
         actions: ["find"],
       },
     ],
     roles: [],
   });
   db.createRole({
     role: "Provider",
     privileges: [
       {
         resource: { db: "test", collection: "medicalView" },
         actions: ["find"],
       },
     ],
     roles: [],
   });
   ```

2. Create the users

   Create users named `James` and `Michelle` with the required roles. Replace the `test` database with your database name.

   ```javascript
   db.createUser({
     user: "James",
     pwd: "js008",
     roles: [{ role: "Billing", db: "test" }],
   });

   db.createUser({
     user: "Michelle",
     pwd: "me009",
     roles: [{ role: "Provider", db: "test" }],
   });
   ```

3. Create the collection

   Run:

   ```javascript
   db.medical.insertMany([
     {
       _id: 0,
       patientName: "Jack Jones",
       diagnosisCode: "CAS 17",
       creditCard: "1234-5678-9012-3456",
     },
     {
       _id: 1,
       patientName: "Mary Smith",
       diagnosisCode: "ACH 01",
       creditCard: "6541-7534-9637-3456",
     },
   ]);
   ```

4. Create the view

   To use a system variable, add `$$` to the start of the variable name. Specify the `USER_ROLES` system variable as `$$USER_ROLES`.

   The view reads the current user roles from the `USER_ROLES` system variable and hides fields based on the roles.

   Run:

   ```javascript
   db.createView("medicalView", "medical", [
     {
       $set: {
         diagnosisCode: {
           $cond: {
             if: { $in: ["Provider", "$$USER_ROLES.role"] },
             then: "$diagnosisCode",
             else: "$$REMOVE",
           },
         },
       },
     },
     {
       $set: {
         creditCard: {
           $cond: {
             if: { $in: ["Billing", "$$USER_ROLES.role"] },
             then: "$creditCard",
             else: "$$REMOVE",
           },
         },
       },
     },
   ]);
   ```

   The view example:
   - includes the `diagnosisCode` field for a user with the `Provider` role.

   - includes the `creditCard` field for a user with the `Billing` role.

   - uses [`$set`](/docs/manual/reference/operator/aggregation/set#mongodb-pipeline-pipe.-set) pipeline stages and [`$$REMOVE`](/docs/manual/reference/aggregation-variables#mongodb-variable-variable.REMOVE) to hide fields based on whether the user who queries the view has the matching role returned in `$$USER_ROLES.role`.

Perform the following steps to retrieve the information accessible to `James`:

1. Log in as James

   Run:

   ```javascript
   db.auth("James", "js008");
   ```

2. Retrieve the documents

   Run:

   ```javascript
   db.medicalView.find();
   ```

3. Examine the documents

   `James` has the `Billing` role and sees the following documents, which include the `creditCard` field but not the `diagnosisCode` field:

   ```javascript
   [
     {
       _id: 0,
       patientName: "Jack Jones",
       creditCard: "1234-5678-9012-3456",
     },
     {
       _id: 1,
       patientName: "Mary Smith",
       creditCard: "6541-7534-9637-3456",
     },
   ];
   ```

Perform the following steps to retrieve the information accessible to `Michelle`:

1. Log in as Michelle

   Run:

   ```javascript
   db.auth("Michelle", "me009");
   ```

2. Retrieve the documents

   Run:

   ```javascript
   db.medicalView.find();
   ```

3. Examine the documents

   `Michelle` has the `Provider` role and sees the following documents, which include the `diagnosisCode` field but not the `creditCard` field:

   ```javascript
   [
     { _id: 0, patientName: "Jack Jones", diagnosisCode: "CAS 17" },
     { _id: 1, patientName: "Mary Smith", diagnosisCode: "ACH 01" },
   ];
   ```

### Retrieve Budget Documents for Roles Granted to the Current User

Starting in MongoDB 7.0, you can use the new [`USER_ROLES`](/docs/manual/reference/aggregation-variables#mongodb-variable-variable.USER_ROLES) system variable to return user [roles.](/docs/manual/core/authorization#std-label-roles)

The scenario in this section shows users with various roles who have limited access to documents in a collection containing budget information.

The scenario shows one possible use of `USER_ROLES`. The `budget` collection contains documents with a field named `allowedRoles`. As you'll see in the following scenario, you can write queries that compare the user roles found in the `allowedRoles` field with the roles returned by the `USER_ROLES` system variable.

**Note:**

For another `USER_ROLES` example scenario, see [Retrieve Medical Information for Roles Granted to the Current User](/docs/manual/core/views/create-view#std-label-create-view-user-roles-system-variable-medical-example). That example doesn't store the user roles in the document fields, as is done in the following example.

For the budget scenario in this section, perform the following steps to create the roles, users, and `budget` collection:

1. Create the roles

   Run:

   ```javascript
   db.createRole({ role: "Marketing", roles: [], privileges: [] });
   db.createRole({ role: "Sales", roles: [], privileges: [] });
   db.createRole({ role: "Development", roles: [], privileges: [] });
   db.createRole({ role: "Operations", roles: [], privileges: [] });
   ```

2. Create the users

   Create users named `John` and `Jane` with the required roles. Replace the `test` database with your database name.

   ```javascript
   db.createUser({
     user: "John",
     pwd: "jn008",
     roles: [
       { role: "Marketing", db: "test" },
       { role: "Development", db: "test" },
       { role: "Operations", db: "test" },
       { role: "read", db: "test" },
     ],
   });

   db.createUser({
     user: "Jane",
     pwd: "je009",
     roles: [
       { role: "Sales", db: "test" },
       { role: "Operations", db: "test" },
       { role: "read", db: "test" },
     ],
   });
   ```

3. Create the collection

   Run:

   ```javascript
   db.budget.insertMany([
     {
       _id: 0,
       allowedRoles: ["Marketing"],
       comment: "For marketing team",
       yearlyBudget: 15000,
     },
     {
       _id: 1,
       allowedRoles: ["Sales"],
       comment: "For sales team",
       yearlyBudget: 17000,
       salesEventsBudget: 1000,
     },
     {
       _id: 2,
       allowedRoles: ["Operations"],
       comment: "For operations team",
       yearlyBudget: 19000,
       cloudBudget: 12000,
     },
     {
       _id: 3,
       allowedRoles: ["Development"],
       comment: "For development team",
       yearlyBudget: 27000,
     },
   ]);
   ```

Perform the following steps to create a view and retrieve the documents accessible to `John`:

1. Create the view

   To use a system variable, add `$$` to the start of the variable name. Specify the `USER_ROLES` system variable as `$$USER_ROLES`.

   Run:

   ```javascript
   db.createView("budgetView", "budget", [
     {
       $match: {
         $expr: {
           $not: {
             $eq: [
               { $setIntersection: ["$allowedRoles", "$$USER_ROLES.role"] },
               [],
             ],
           },
         },
       },
     },
   ]);
   ```

   If you cannot create the view, ensure you log in as a user with the privilege to create a view.

   The previous example returns the documents from the `budget` collection that match at least one of the roles that the user who runs the example has. To do that, the example uses [`$setIntersection`](/docs/manual/reference/operator/aggregation/setIntersection#mongodb-expression-exp.-setIntersection) to return documents where the intersection between the `budget` document `allowedRoles` field and the set of user roles from `$$USER_ROLES` is not empty.

2. Log in as John

   Run:

   ```javascript
   db.auth("John", "jn008");
   ```

3. Retrieve the documents

   Run:

   ```javascript
   db.budgetView.find();
   ```

4. Examine the documents

   `John` has the `Marketing`, `Operations`, and `Development` roles, and sees these documents:

   ```javascript
   [
     {
       _id: 0,
       allowedRoles: ["Marketing"],
       comment: "For marketing team",
       yearlyBudget: 15000,
     },
     {
       _id: 2,
       allowedRoles: ["Operations"],
       comment: "For operations team",
       yearlyBudget: 19000,
       cloudBudget: 12000,
     },
     {
       _id: 3,
       allowedRoles: ["Development"],
       comment: "For development team",
       yearlyBudget: 27000,
     },
   ];
   ```

Perform the following steps to retrieve the documents accessible to Jane:

1. Log in as `Jane`

   Run:

   ```javascript
   db.auth("Jane", "je009");
   ```

2. Retrieve the documents

   Run:

   ```javascript
   db.budgetView.find();
   ```

3. Examine the documents

   `Jane` has the `Sales` and `Operations` roles, and sees these documents:

   ```javascript
   [
     {
       _id: 1,
       allowedRoles: ["Sales"],
       comment: "For sales team",
       yearlyBudget: 17000,
       salesEventsBudget: 1000,
     },
     {
       _id: 2,
       allowedRoles: ["Operations"],
       comment: "For operations team",
       yearlyBudget: 19000,
       cloudBudget: 12000,
     },
   ];
   ```

   **Note:**

   On a sharded cluster, a query can be run on a shard by another server node on behalf of the user. In those queries, `USER_ROLES` is still populated with the roles for the user.

### Roles with the Same Name in Multiple Databases

Multiple databases can have roles with the same name. If you create a view and reference a specific role in the view, you should either specify both the `db` database name field and the `role` field, or specify the `_id` field that contains the database name and the role.

The following example returns the roles assigned to `Jane`, who has roles with different names. The example returns the `_id`, `role`, and `db` database name:

1. Log in as `Jane`

   Run:

   ```javascript
   db.auth("Jane", "je009");
   ```

2. Retrieve the documents

   Run:

   ```javascript
   db.budget.findOne({}, { myRoles: "$$USER_ROLES" });
   ```

3. Examine the documents

   Example output, which shows the `_id`, `role`, and `db` database name in the `myRoles` array:

   ```javascript
   {
      _id: 0,
      myRoles: [
         { _id: 'test.Operations', role: 'Operations', db: 'test' },
         { _id: 'test.Sales', role: 'Sales', db: 'test' },
         { _id: 'test.read', role: 'read', db: 'test' }
      ]
   }
   ```

## Behavior

### Aggregation Optimizations

When you query a view:

- Query `filter`, `projection`, `sort`, `skip`, `limit`, and other operations for [`db.collection.find()`](/docs/manual/reference/method/db.collection.find#mongodb-method-db.collection.find) are converted to the equivalent [aggregation pipeline stages.](/docs/manual/reference/mql/aggregation-stages#std-label-aggregation-pipeline-operator-reference)

- MongoDB appends the client query to the underlying pipeline and returns the results of that combined pipeline to the client. MongoDB may apply [aggregation pipeline optimizations](/docs/manual/core/aggregation-pipeline-optimization#std-label-agg-pipeline-optimization) to the combined pipeline.

- The aggregation pipeline optimizer reshapes the view aggregation pipeline stages to improve performance without changing the query results.

### Resource Locking

[`db.createView()`](/docs/manual/reference/method/db.createView#mongodb-method-db.createView) obtains an exclusive lock on the specified collection or view for the duration of the operation. All subsequent operations on the collection must wait until [`db.createView()`](/docs/manual/reference/method/db.createView#mongodb-method-db.createView) releases the lock. [`db.createView()`](/docs/manual/reference/method/db.createView#mongodb-method-db.createView) typically holds this lock for a short time.

Creating a view requires obtaining an additional exclusive lock on the `system.views` collection in the database. This lock blocks creation or modification of views in the database until the command completes.
