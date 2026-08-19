> For the complete MongoDB documentation index, see www.mongodb.com/docs/llms.txt

<!--
Tab options on this page. Append to the .md URL to filter:
  ?tabs=<id,...>   select specific tabs (e.g. ?tabs=nodejs,shell)
  ?allTabs=true    include every tab
  (no param)       default: one tab per tabset

Available tabs:
  other tabs: config-file, command-line
-->

# Create Rolling Index Builds on Sharded Clusters

## About this Task

Rolling index builds are an alternative to [default index builds.](/docs/manual/core/index-creation#std-label-index-operations)

**Warning:**

Avoid performing rolling index and replicated index build processes concurrently as it might lead to unexpected issues, such as broken builds and crash loops.

## Considerations

**Warning:**

Make sure you are not performing [DDL operations](/docs/manual/reference/ddl-operations#std-label-ddl-operations) while conducting the rolling index build.

### Unique Indexes

To create [unique indexes](/docs/manual/core/index-unique#std-label-index-type-unique) using the following procedure, you must stop all writes to the collection during this procedure.

If you cannot stop all writes to the collection during this procedure, do not use the procedure on this page. Instead, build your unique index on the collection by issuing [`db.collection.createIndex()`](/docs/manual/reference/method/db.collection.createIndex#mongodb-method-db.collection.createIndex) on the [`mongos`](/docs/manual/reference/program/mongos#mongodb-binary-bin.mongos) for a sharded cluster.

### Oplog Size

Ensure that your [oplog](/docs/manual/reference/glossary#std-term-oplog) is large enough to permit the indexing or re-indexing operation to complete without falling too far behind to catch up. See the [oplog sizing](/docs/manual/core/replica-set-oplog#std-label-replica-set-oplog-sizing) documentation for additional information.

Rolling index builds lower the resiliency of your cluster and increase build duration.

## Before You Begin

For building unique indexes

1. To create [unique indexes](/docs/manual/core/index-unique#std-label-index-type-unique) using the following procedure, you must stop all writes to the collection during the index build. Otherwise, you may end up with inconsistent data across the replica set members. If you cannot stop all writes to the collection, do not use the following procedure to create unique indexes.

   **Warning:**

   If you cannot stop all writes to the collection, do not use the following procedure to create unique indexes.

2. Before creating the index, validate that no documents in the collection violate the index constraints. If a collection is distributed across shards and a shard contains a chunk with duplicate documents, the create index operation may succeed on the shards without duplicates but not on the shard with duplicates. To avoid leaving inconsistent indexes across shards, you can issue the [`db.collection.dropIndex()`](/docs/manual/reference/method/db.collection.dropIndex#mongodb-method-db.collection.dropIndex) from a [`mongos`](/docs/manual/reference/program/mongos#mongodb-binary-bin.mongos) to drop the index from the collection.

Starting in MongoDB 8.0, you can use the [`directShardOperations`](/docs/manual/reference/built-in-roles#mongodb-authrole-directShardOperations) role to perform maintenance operations that require you to execute commands directly against a shard.

**Warning:**

Running commands using the `directShardOperations` role can cause your cluster to stop working correctly and may cause data corruption. Only use the `directShardOperations` role for maintenance purposes or under the guidance of MongoDB support. Stop using the `directShardOperations` role when you finish performing maintenance operations.

## Procedure

**Important:**

The following procedure to build indexes in a rolling fashion applies to sharded clusters deployments, and not replica set deployments. For the procedure for replica sets, see [Create a Rolling Index Build on Replica Sets](/docs/manual/tutorial/build-indexes-on-replica-sets) instead.

### A. Stop Migrations

Connect [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh) to a [`mongos`](/docs/manual/reference/program/mongos#mongodb-binary-bin.mongos) instance in the sharded cluster and disable migrations for the collection where you want to perform the rolling build index:

```javascript
db.adminCommand({
  setAllowMigrations: "<db>.<collection>",
  allowMigrations: false,
});
```

The preceding command ensures the correct set of shards is targeted for rolling index builds because no migration for the collection will be allowed to commit.

If the command returns the following error, it means the collection is unsharded. You can safely ignore the error and continue with the next step.

```javascript
MongoServerError[NamespaceNotSharded]: Collection must be sharded so migrations can be blocked
```

### B. Determine the Distribution of the Collection

To determine which shards must be involved in the rolling index build, run the following aggregation on the collection that you want to build the index on:

```javascript
db.getSiblingDB(<db>).getCollection(<collection>).aggregate([{$collStats:{}},{$group: {_id: "$ns", shard_list: {$addToSet: "$shard"}}}])
```

For example, if you want to create an index on the `records` collection in the `test` database:

```javascript
db.getSiblingDB("test")
  .getCollection("records")
  .aggregate([
    { $collStats: {} },
    { $group: { _id: "$ns", shard_list: { $addToSet: "$shard" } } },
  ]);
```

**Output:**

```javascript
[{ _id: "test.records", shard_list: ["shardA", "shardC"] }];
```

From the output, you only build the indexes for `test.records` on `shardA` and `shardC`.

### C. Build Indexes on the Shards That Contain Collection Chunks

For each shard that contains chunks for the collection, follow the procedure to build the index on the shard.

#### C1. Stop One Secondary and Restart as a Standalone

For an affected shard, stop the [`mongod`](/docs/manual/reference/program/mongod#mongodb-binary-bin.mongod) process associated with one of its secondary. Restart after making the following configuration updates:

### Configuration File

If you are using a configuration file, make the following configuration updates:

- Change the [`net.port`](/docs/manual/reference/configuration-options#mongodb-setting-net.port) to a different port. Make a note of the original port setting as a comment.

- Comment out the [`replication.replSetName`](/docs/manual/reference/configuration-options#mongodb-setting-replication.replSetName) option.

- Comment out the [`sharding.clusterRole`](/docs/manual/reference/configuration-options#mongodb-setting-sharding.clusterRole) option.

- Set parameter [`skipShardingConfigurationChecks`](/docs/manual/reference/parameters#mongodb-parameter-param.skipShardingConfigurationChecks) to `true` in the [`setParameter`](/docs/manual/reference/configuration-options#mongodb-setting-setParameter) section.

- Set parameter `disableLogicalSessionCacheRefresh` to `true` in the [`setParameter`](/docs/manual/reference/configuration-options#mongodb-setting-setParameter) section.

For example, for a shard replica set member, the updated configuration file will include content like the following example:

```yaml
net:
  bindIp: localhost,<hostname(s)|ip address(es)>
  port: 27218
#   port: 27018
#replication:
#   replSetName: shardA
#sharding:
#   clusterRole: shardsvr
setParameter:
  skipShardingConfigurationChecks: true
  disableLogicalSessionCacheRefresh: true
```

And restart:

```bash
mongod --config <path/To/ConfigFile>
```

Other settings (e.g. [`storage.dbPath`](/docs/manual/reference/configuration-options#mongodb-setting-storage.dbPath), etc.) remain the same.

By running the [`mongod`](/docs/manual/reference/program/mongod#mongodb-binary-bin.mongod) on a different port, you ensure that the other members of the replica set and all clients will not contact the member while you are building the index.

#### C2. Build the Index

Connect directly to the [`mongod`](/docs/manual/reference/program/mongod#mongodb-binary-bin.mongod) instance running as a standalone on the new port and create the new index for this instance.

For example, connect [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh) to the instance, and use the [`db.collection.createIndex()`](/docs/manual/reference/method/db.collection.createIndex#mongodb-method-db.collection.createIndex) method to create an ascending index on the `username` field of the `records` collection:

```bash
db.records.createIndex( { username: 1 } )
```

#### C3. Restart the Program `mongod` as a Replica Set Member

When the index build completes, shutdown the [`mongod`](/docs/manual/reference/program/mongod#mongodb-binary-bin.mongod) instance. Undo the configuration changes made when starting as a standalone to return to its original configuration and restart.

**Important:**

Be sure to remove the [`skipShardingConfigurationChecks`](/docs/manual/reference/parameters#mongodb-parameter-param.skipShardingConfigurationChecks) parameter and `disableLogicalSessionCacheRefresh` parameter.

For example, to restart your replica set shard member:

### Configuration File

If you are using a configuration file:

- Revert to the original port number.

- Uncomment the [`replication.replSetName`.](/docs/manual/reference/configuration-options#mongodb-setting-replication.replSetName)

- Uncomment the [`sharding.clusterRole`.](/docs/manual/reference/configuration-options#mongodb-setting-sharding.clusterRole)

- Remove parameter [`skipShardingConfigurationChecks`](/docs/manual/reference/parameters#mongodb-parameter-param.skipShardingConfigurationChecks) in the [`setParameter`](/docs/manual/reference/configuration-options#mongodb-setting-setParameter) section.

- Remove parameter `disableLogicalSessionCacheRefresh` in the [`setParameter`](/docs/manual/reference/configuration-options#mongodb-setting-setParameter) section.

```yaml
net:
  bindIp: localhost,<hostname(s)|ip address(es)>
  port: 27018
replication:
  replSetName: shardA
sharding:
  clusterRole: shardsvr
```

Other settings (e.g. [`storage.dbPath`](/docs/manual/reference/configuration-options#mongodb-setting-storage.dbPath), etc.) remain the same.

And restart:

```bash
mongod --config <path/To/ConfigFile>
```

Allow replication to catch up on this member.

#### C4. Repeat the Procedure for the Remaining Secondaries for the Shard

Once the member catches up with the other members of the set, repeat the procedure one member at a time for the remaining secondary members for the shard:

1. [C1. Stop One Secondary and Restart as a Standalone](/docs/manual/tutorial/build-indexes-on-sharded-clusters#std-label-tutorial-index-on-sharded-clusters-stop-one-member)

2. [C2. Build the Index](/docs/manual/tutorial/build-indexes-on-sharded-clusters#std-label-tutorial-index-on-sharded-clusters-build-index)

3. [C3. Restart the Program `mongod` as a Replica Set Member](/docs/manual/tutorial/build-indexes-on-sharded-clusters#std-label-tutorial-index-on-sharded-clusters-restart-mongod)

#### C5. Build the Index on the Primary

When all the secondaries for the shard have the new index, step down the primary for the shard, restart it as a standalone using the procedure described above, and build the index on the former primary:

1. Use the [`rs.stepDown()`](/docs/manual/reference/method/rs.stepDown#mongodb-method-rs.stepDown) method in [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh) to step down the primary. Upon successful stepdown, the current primary becomes a secondary and the replica set members elect a new primary.

2. [C1. Stop One Secondary and Restart as a Standalone](/docs/manual/tutorial/build-indexes-on-sharded-clusters#std-label-tutorial-index-on-sharded-clusters-stop-one-member)

3. [C2. Build the Index](/docs/manual/tutorial/build-indexes-on-sharded-clusters#std-label-tutorial-index-on-sharded-clusters-build-index)

4. [C3. Restart the Program `mongod` as a Replica Set Member](/docs/manual/tutorial/build-indexes-on-sharded-clusters#std-label-tutorial-index-on-sharded-clusters-restart-mongod)

### D. Repeat for the Other Affected Shards

Once you finish building the index for a shard, repeat [C. Build Indexes on the Shards That Contain Collection Chunks](/docs/manual/tutorial/build-indexes-on-sharded-clusters#std-label-tutorial-index-on-affected-shards) for the other affected shards.

### E. Enable Migrations

Connect [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh) to a [`mongos`](/docs/manual/reference/program/mongos#mongodb-binary-bin.mongos) instance in the sharded cluster and re-enable the migration with [`setAllowMigrations`:](/docs/manual/reference/command/setAllowMigrations#mongodb-dbcommand-dbcmd.setAllowMigrations)

```javascript
db.adminCommand({
  setAllowMigrations: "<db>.<collection>",
  allowMigrations: true,
});
```

If the command returns the following error, it means the collection is unsharded. You can safely ignore the error.

```javascript
MongoServerError[NamespaceNotSharded]: Collection must be sharded so migrations can be blocked
```

## Additional Information

A sharded collection has an inconsistent index if the collection does not have the exact same indexes (including the index options) on each shard that contains chunks for the collection. Although inconsistent indexes should not occur during normal operations, inconsistent indexes can occur, such as:

- When a user is creating an index with a `unique` key constraint and one shard contains a chunk with duplicate documents. In such cases, the create index operation may succeed on the shards without duplicates but not on the shard with duplicates.

- When a user is creating an index across the shards in a rolling manner but either fails to build the index for an associated shard or incorrectly builds an index with different specification.

The [config server](/docs/manual/core/sharded-cluster-config-servers#std-label-sharding-config-server) primary periodically checks for index inconsistencies across the shards for sharded collections. To configure these periodic checks, see [`enableShardedIndexConsistencyCheck`](/docs/manual/reference/parameters#mongodb-parameter-param.enableShardedIndexConsistencyCheck) and [`shardedIndexConsistencyCheckIntervalMS`.](/docs/manual/reference/parameters#mongodb-parameter-param.shardedIndexConsistencyCheckIntervalMS)

The command [`serverStatus`](/docs/manual/reference/command/serverStatus#mongodb-dbcommand-dbcmd.serverStatus) returns the field [`shardedIndexConsistency`](/docs/manual/reference/command/serverStatus#mongodb-serverstatus-serverstatus.shardedIndexConsistency) to report on index inconsistencies when run on the config server primary.

To check if a sharded collection has inconsistent indexes, see [Find Inconsistent Indexes Across Shards.](/docs/manual/tutorial/manage-indexes#std-label-manage-indexes-find-inconsistent-indexes)
