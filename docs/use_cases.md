> For the complete MongoDB documentation index, see www.mongodb.com/docs/llms.txt

# Document Structure Use Cases

In addition to defining data records, MongoDB uses the document structure throughout, including but not limited to: [query filters](/docs/manual/core/documents-other-uses#std-label-document-query-filter), [update specifications documents](/docs/manual/core/documents-other-uses#std-label-document-update-specification), and [index specification documents](/docs/manual/core/documents-other-uses#std-label-document-index-specification)

## Query Filter Documents

Query filter documents specify the conditions that determine which records to select for read, update, and delete operations.

You can use `<field>:<value>` expressions to specify the equality condition and [query operator](/docs/manual/reference/mql/query-predicates#std-label-query-projection-operators-top) expressions.

```javascript
{
  <field1>: <value1>,
  <field2>: { <operator>: <value> },
  ...
}
```

For examples, see:

- [Read Documents](/docs/manual/tutorial/query-documents)

- [Query on Embedded/Nested Documents](/docs/manual/tutorial/query-embedded-documents)

- [Query an Array](/docs/manual/tutorial/query-arrays)

- [Query an Array of Embedded Documents](/docs/manual/tutorial/query-array-of-documents/)

## Update Specification Documents

Update specification documents use [update operators](/docs/manual/reference/mql/update#std-label-update-operators) to specify the data modifications to perform on specific fields during an update operation.

```javascript
{
  <operator1>: { <field1>: <value1>, ... },
  <operator2>: { <field2>: <value2>, ... },
  ...
}
```

For examples, see [Update specifications.](/docs/manual/tutorial/update-documents#std-label-update-documents-modifiers)

## Index Specification Documents

Index specification documents define the field to index and the index type:

```javascript
{ <field1>: <type1>, <field2>: <type2>, ...  }
```
