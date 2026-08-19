> For the complete MongoDB documentation index, see www.mongodb.com/docs/llms.txt

# Documents

A document is the basic unit of data in MongoDB.

MongoDB's object-oriented data model lets you structure data to mirror the object models in your codebase, which eliminates the object-relational mapping required by relational databases.

**Note:**

MongoDB stores data records as BSON documents. BSON is a binary representation of [JSON](/docs/manual/reference/glossary#std-term-JSON) documents, though it contains more data types than JSON. For the BSON spec, see [bsonspec.org](http://bsonspec.org/). See also [BSON Types.](/docs/manual/reference/bson-types#std-label-bson-types)

![A MongoDB document.](/images/crud-annotated-document.svg)

## Document Structure

MongoDB documents are composed of field-and-value pairs and have the following structure:

```javascript
{
   field1: value1,
   field2: value2,
   field3: value3,
   ...
   fieldN: valueN
}
```

The value of a field can be any of the BSON [data types](/docs/manual/reference/bson-types#std-label-bson-types), including other documents, arrays, and arrays of documents. For example, the following document contains values of varying types:

```javascript
var mydoc = {
  _id: ObjectId("5099803df3f4948bd2f98391"),
  name: { first: "Alan", last: "Turing" },
  birth: new Date("Jun 23, 1912"),
  death: new Date("Jun 07, 1954"),
  contribs: ["Turing machine", "Turing test", "Turingery"],
  views: Long(1250000),
};
```

The above fields have the following data types:

- `_id` holds an [ObjectId.](/docs/manual/reference/bson-types#std-label-objectid)

- `name` holds an _embedded document_ that contains the fields `first` and `last`.

- `birth` and `death` hold values of the _Date_ type.

- `contribs` holds an _array of strings_.

- `views` holds a value of the _NumberLong_ type.

### Field Names

Field names are strings.

[Documents](/docs/manual/core/document#std-label-bson-document-format) have the following restrictions on field names:

- The field name `_id` is reserved for use as a primary key; its value must be unique in the collection, is immutable, and may be of any type other than an array or regex. If the `_id` contains subfields, the subfield names cannot begin with a (`$`) symbol.

* Field names **cannot** contain the `null` character.

* The server permits storage of field names that contain dots (`.`) and dollar signs (`$`).

* MongodB 5.0 adds improved support for the use of (`$`) and (`.`) in field names. There are some restrictions. See [Field Name Considerations](/docs/manual/core/dot-dollar-considerations#std-label-crud-concepts-dot-dollar-considerations) for more details.

* Each field name must be unique within the document. You must not store documents with duplicate fields because MongoDB [CRUD](/docs/manual/crud#std-label-crud) operations might behave unexpectedly if a document has duplicate fields.

The MongoDB Query Language doesn't support documents with duplicate field names:

- Although some BSON builders may support creating a BSON document with duplicate field names, inserting these documents into MongoDB isn't supported even if the insert succeeds, or appears to succeed.

- For example, inserting a BSON document with duplicate field names through a MongoDB driver may result in the driver silently dropping the duplicate values prior to insertion, or may result in an invalid document being inserted that contains duplicate fields. Querying those documents leads to inconsistent results.

- Updating documents with duplicate field names isn't supported, even if the update succeeds or appears to succeed.

Starting in MongoDB 6.1, to see if a document has duplicate field names, use the [`validate`](/docs/manual/reference/command/validate#mongodb-dbcommand-dbcmd.validate) command with the `full` field set to `true`. In any MongoDB version, use the [`$objectToArray`](/docs/manual/reference/operator/aggregation/objectToArray#mongodb-expression-exp.-objectToArray) aggregation operator to see if a document has duplicate field names.

## Dot Notation

MongoDB uses the _dot notation_ to access the elements of an array and to access the fields of an embedded document.

### Arrays

To specify or access an element of an array by the zero-based index position, concatenate the array name with the dot (`.`) and zero-based index position, and enclose in quotes:

```javascript
"<array>.<index>";
```

For example, given the following field in a document:

```javascript
{
   ...
   contribs: [ "Turing machine", "Turing test", "Turingery" ],
   ...
}
```

To specify the third element in the `contribs` array, use the dot notation `"contribs.2"`.

For examples querying arrays, see:

- [Query an Array](/docs/manual/tutorial/query-arrays)

- [Query an Array of Embedded Documents](/docs/manual/tutorial/query-array-of-documents/)

**Note: Positional Operators**

- The [`$[]`](/docs/manual/reference/operator/update/positional-all#mongodb-update-up.---) all positional operator updates all elements in the specified array field during an update operation.

- The [`$[<identifier>]`](/docs/manual/reference/operator/update/positional-filtered#mongodb-update-up.---identifier--) filtered positional operator updates all array elements that match the conditions specified in arrayFilters.

- The [`$`](/docs/manual/reference/operator/update/positional#mongodb-update-up.-) positional operator updates the first array element that matches the query condition, without requiring you to specify its index.

- The [`$`](/docs/manual/reference/operator/projection/positional#mongodb-projection-proj.-) projection operator returns the first array element that matches the query condition in a read operation.

- For dot notation examples with arrays, including queries by zero-based array index position, see [Query an Array.](/docs/manual/tutorial/query-arrays#std-label-read-operations-arrays)

### Embedded Documents

To specify or access a field of an embedded document with dot notation, concatenate the embedded document name with the dot (`.`) and the field name, and enclose in quotes:

```javascript
"<embedded document>.<field>";
```

For example, given the following field in a document:

```javascript
{
   ...
   name: { first: "Alan", last: "Turing" },
   contact: { phone: { type: "cell", number: "111-222-3333" } },
   ...
}
```

- To specify the field named `last` in the `name` field, use the dot notation `"name.last"`.

- To specify the `number` in the `phone` document in the `contact` field, use the dot notation `"contact.phone.number"`.

**Warning:**

Partition fields cannot use field names that contain a dot (`.`).

For examples querying embedded documents, see:

- [Query on Embedded/Nested Documents](/docs/manual/tutorial/query-embedded-documents)

- [Query an Array of Embedded Documents](/docs/manual/tutorial/query-array-of-documents/)

## Document Limitations

Documents have the following attributes:

### Document Size Limit

The maximum BSON document size is 16 mebibytes.

The maximum document size helps ensure that a single document cannot use an excessive amount of RAM or, during transmission, an excessive amount of bandwidth. To store documents larger than the maximum size, MongoDB provides the GridFS API. For more information about GridFS, see [`mongofiles`](https://www.mongodb.com/docs/database-tools/mongofiles/#mongodb-binary-bin.mongofiles) and the documentation for your [driver.](https://www.mongodb.com/docs/drivers/)

### Document Field Order

Unlike JavaScript objects, the fields in a BSON document are ordered.

#### Field Order in Queries

For queries, the field order behavior is as follows:

- When comparing documents, field ordering is significant. For example, when comparing documents with fields `a` and `b` in a query:
  - `{a: 1, b: 1}` is equal to `{a: 1, b: 1}`

  - `{a: 1, b: 1}` is not equal to `{b: 1, a: 1}`

- For efficient query execution, the query engine may reorder fields during query processing. Among other cases, reordering fields may occur when processing these projection operators: [`$project`](/docs/manual/reference/operator/aggregation/project#mongodb-pipeline-pipe.-project), [`$addFields`](/docs/manual/reference/operator/aggregation/addFields#mongodb-pipeline-pipe.-addFields), [`$set`](/docs/manual/reference/operator/aggregation/set#mongodb-pipeline-pipe.-set), and [`$unset`.](/docs/manual/reference/operator/aggregation/unset#mongodb-pipeline-pipe.-unset)
  - Field reordering may occur in intermediate results as well as the final results returned by a query.

  - Because some operations may reorder fields, you should not rely on specific field ordering in the results returned by a query that uses the projection operators listed earlier.

#### Field Order in Write Operations

For write operations, MongoDB preserves the order of the document fields _except_ for the following cases:

- The `_id` field is always the first field in the document.

- Updates that include [`renaming`](/docs/manual/reference/operator/update/rename#mongodb-update-up.-rename) of field names may result in the reordering of fields in the document.

### The `_id` Field

In MongoDB, each document stored in a standard collection requires a unique [\_id](/docs/manual/reference/glossary#std-term-_id) field that acts as a [primary key](/docs/manual/reference/glossary#std-term-primary-key). If an inserted document omits the `_id` field, the MongoDB driver automatically generates an [ObjectId](/docs/manual/reference/bson-types#std-label-objectid) for the `_id` field.

This also applies to documents inserted through update operations with [upsert: true.](/docs/manual/reference/method/db.collection.update#std-label-update-upsert)

**Note:**

In [time series collections](/docs/manual/core/timeseries-collections#std-label-manual-timeseries-collection), documents do not require a unique [\_id](/docs/manual/reference/glossary#std-term-_id) field because MongoDB does not create an index on the `_id` field.

The `_id` field has the following behavior and constraints:

- By default, MongoDB creates a unique index on the `_id` field during the creation of a collection.

- The `_id` field is always the first field in the documents. If the server receives a document that does not have the `_id` field first, then the server will move the field to the beginning.

- If the `_id` contains subfields, the subfield names cannot begin with a (`$`) symbol.

- The `_id` field may contain values of any [BSON data type](/docs/manual/reference/bson-types#std-label-bson-types), other than an array, regex, or undefined.

  **Warning:**

  To ensure functioning replication, do not store values that are of the BSON regular expression type in the `_id` field.

The following are common options for storing values for `_id`:

- Use an [ObjectId.](/docs/manual/reference/bson-types#std-label-objectid)

- Use a natural unique identifier, if available. This saves space and avoids an additional index.

- Generate an auto-incrementing number.

- Generate a UUID in your application code. For a more efficient storage of the UUID values in the collection and in the `_id` index, store the UUID as a value of the BSON `BinData` type.

  Index keys that are of the `BinData` type are more efficiently stored in the index if:
  - the binary subtype value is in the range of 0-7 or 128-135, and

  - the length of the byte array is: 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 24, or 32.

- Use your driver's BSON UUID facility to generate UUIDs. Be aware that driver implementations may implement UUID serialization and deserialization logic differently, which may not be fully compatible with other drivers. See your [driver documentation](https://www.mongodb.com/docs/drivers/) for information concerning UUID interoperability.

**Note:**

Most MongoDB driver clients include the `_id` field and generate an `ObjectId` before sending the insert operation to MongoDB. However, if the client sends a document without an `_id` field, the [`mongod`](/docs/manual/reference/program/mongod#mongodb-binary-bin.mongod) adds the `_id` field and generates the `ObjectId`.
