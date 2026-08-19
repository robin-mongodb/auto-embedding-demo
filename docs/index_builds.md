> For the complete MongoDB documentation index, see www.mongodb.com/docs/llms.txt

# Index Builds on Populated Collections

Index builds use an optimized build process that holds an exclusive lock on the collection at the beginning and end of the index build. The rest of the build process yields to interleaving read and write operations. For a detailed description of index build process and locking behavior, see [Index Build Process.](/docs/manual/core/index-creation#std-label-index-build-process)

Index builds on a replica set or sharded cluster build simultaneously across all data-bearing replica set members. The primary requires a minimum number of data-bearing voting members (that is, commit quorum), including itself, that must complete the build before marking the index as ready for use. A "voting" member is any replica set member where [`members[n].votes`](/docs/manual/reference/replica-configuration#mongodb-rsconf-rsconf.members-n-.votes) is greater than `0`. See [Index Builds in Replicated Environments](/docs/manual/core/index-creation#std-label-index-operations-replicated-build) for more information.

Starting in MongoDB 7.1, index builds are improved with faster error reporting and increased failure resilience. You can also set the minimum available disk space required for index builds using the new [`indexBuildMinAvailableDiskSpaceMB`](/docs/manual/reference/parameters#mongodb-parameter-param.indexBuildMinAvailableDiskSpaceMB) parameter, which stops index builds if disk space is too low.

The following table compares the index build behavior starting in MongoDB 7.1 with earlier versions.

| Behavior Starting in MongoDB 7.1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Behavior in Earlier MongoDB Versions                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Index errors found during the collection scan phase, except duplicate key errors, are returned immediately and then the index build stops. Earlier MongoDB versions return errors in the commit phase, which occurs near the end of the index build. MongoDB 7.1 helps you to rapidly diagnose index errors. For example, if an incompatible index value format is found, the error is returned to you immediately.                                                                                                                             | Index build errors can take a long time to be returned compared to MongoDB 7.1 because the errors are returned near the end of the index build in the commit phase. |
| Increased resilience for your deployment. If an index build error occurs, a [secondary](/docs/manual/reference/glossary#std-term-secondary) member can request that the [primary](/docs/manual/reference/glossary#std-term-primary) member stop an index build and the secondary member does not crash. A request to stop an index build is not always possible: if a member has already voted to commit the index, then the secondary cannot request that the index build stop and the secondary crashes (similar to MongoDB 7.0 and earlier). | An index build error can cause a secondary member to crash.                                                                                                         |
| Improved disk space management for index builds. An index build may be automatically stopped if the available disk space is below the minimum specified in the [`indexBuildMinAvailableDiskSpaceMB`](/docs/manual/reference/parameters#mongodb-parameter-param.indexBuildMinAvailableDiskSpaceMB) parameter. If a member has already voted to commit the index, then the index build is not stopped.                                                                                                                                            | An index build is not stopped if there is insufficient available disk space.                                                                                        |

**Note:**

For information about creating indexes in Atlas, refer to the [index management](https://www.mongodb.com/docs/atlas/atlas-ui/indexes/) page in the Atlas documentation.

## Behavior

### Comparison to Foreground and Background Builds

Previous versions of MongoDB supported building indexes either in the foreground or background. Foreground index builds were fast and produced more efficient index data structures, but required blocking all read-write access to the parent database of the collection being indexed for the duration of the build. Background index builds were slower and produced less efficient results, but allowed read-write access to the database and its collections during the build.

Index builds now obtain an exclusive lock on the collection being indexed only at the start and end of the build. The rest of the build process uses the yielding behavior of background index builds to maximize read-write access to the collection during the build. Index builds still produce efficient index data structures despite the more permissive locking behavior.

The optimized index build performance is at least on par with background index builds. For workloads with few or no updates received during the build process, optimized index builds can be as fast as a foreground index build on that same data.

Use [`db.currentOp()`](/docs/manual/reference/method/db.currentOp#mongodb-method-db.currentOp) to monitor the progress of ongoing index builds.

MongoDB ignores the `background` index build option if specified to [`createIndexes`](/docs/manual/reference/command/createIndexes#mongodb-dbcommand-dbcmd.createIndexes) or its shell helpers [`createIndex()`](/docs/manual/reference/method/db.collection.createIndex#mongodb-method-db.collection.createIndex) and [`createIndexes()`.](/docs/manual/reference/method/db.collection.createIndexes#mongodb-method-db.collection.createIndexes)

### Constraint Violations During Index Build

For indexes that enforce constraints on the collection, such as [unique](/docs/manual/core/index-unique#std-label-index-type-unique) indexes, the [`mongod`](/docs/manual/reference/program/mongod#mongodb-binary-bin.mongod) checks all pre-existing and concurrently-written documents for violations of those constraints _after_ the index build completes. Documents that violate the index constraints can exist during the index build. If any documents violate the index constraints at the end of the build, the `mongod` terminates the build and throws an error.

For example, consider a populated collection `inventory`. An administrator wants to create a unique index on the `product_sku` field. If any documents in the collection have duplicate values for `product_sku`, the index build can still start successfully. If any violations still exist at the end of the build, the `mongod` terminates the build and throws an error.

Similarly, an application can successfully write documents to the `inventory` collection with duplicate values of `product_sku` while the index build is in progress.

To mitigate the risk of index build failure due to constraint violations:

- Validate that no documents in the collection violate the index constraints.

- Stop all writes to the collection from applications that cannot guarantee violation-free write operations.

#### Sharded Collections

For a sharded collection distributed across multiple shards, one or more shards may contain a chunk with duplicate documents. As such, the create index operation may succeed on some of the shards (that is, the ones without duplicates) but not on others (that is, the ones with duplicates). To avoid leaving inconsistent indexes across shards, you can issue the [`db.collection.dropIndex()`](/docs/manual/reference/method/db.collection.dropIndex#mongodb-method-db.collection.dropIndex) from a [`mongos`](/docs/manual/reference/program/mongos#mongodb-binary-bin.mongos) to drop the index from the collection.

To mitigate the risk of this occurrence, before creating the index:

- Validate that no documents in the collection violate the index constraints.

- Stop all writes to the collection from applications that cannot guarantee violation-free write operations.

**See also:**

[Index Consistency Checks for Sharded Collections](/docs/manual/core/index-creation#std-label-index-creation-index-consistency)

### Maximum Concurrent Index Builds

By default, the server allows up to three concurrent index builds. To change the number of allowed concurrent index builds, modify the [`maxNumActiveUserIndexBuilds`](/docs/manual/reference/parameters#mongodb-parameter-param.maxNumActiveUserIndexBuilds) parameter.

If the number of concurrent index builds reaches the limit specified by `maxNumActiveUserIndexBuilds`, the server blocks additional index builds until the number of concurrent index builds drops below the limit.

## Index Build Impact on Database Performance

### Index Builds During Write-Heavy Workloads

Building indexes when the target collection is under heavy write load can result in reduced write performance and longer index builds.

Consider designating a maintenance window during which applications stop or reduce write operations against the collection. Start the index build during this maintenance window.

### Insufficient Available System Memory (RAM)

[`createIndexes`](/docs/manual/reference/command/createIndexes#mongodb-dbcommand-dbcmd.createIndexes) supports building one or more indexes on a collection. [`createIndexes`](/docs/manual/reference/command/createIndexes#mongodb-dbcommand-dbcmd.createIndexes) uses a combination of memory and temporary files on disk to build indexes. The default memory limit is 200 megabytes per [`createIndexes`](/docs/manual/reference/command/createIndexes#mongodb-dbcommand-dbcmd.createIndexes) command, shared equally among all indexes built in that command. For example, if you build 10 indexes with one [`createIndexes`](/docs/manual/reference/command/createIndexes#mongodb-dbcommand-dbcmd.createIndexes) command, MongoDB allocates each index 20 megabytes for the index build process when using the default memory limit of 200. When you reach the memory limit, MongoDB creates temporary files in the `_tmp` subdirectory within [`--dbpath`](/docs/manual/reference/program/mongod#std-option-mongod.--dbpath) to complete the build.

Adjust the memory limit with the [`maxIndexBuildMemoryUsageMegabytes`](/docs/manual/reference/parameters#mongodb-parameter-param.maxIndexBuildMemoryUsageMegabytes) parameter. Increasing this parameter is only necessary in rare cases, such as when you run many simultaneous index builds with a single [`createIndexes`](/docs/manual/reference/command/createIndexes#mongodb-dbcommand-dbcmd.createIndexes) command or when you index a data set larger than 500GB.

Each [`createIndexes`](/docs/manual/reference/command/createIndexes#mongodb-dbcommand-dbcmd.createIndexes) command has a limit of [`maxIndexBuildMemoryUsageMegabytes`](/docs/manual/reference/parameters#mongodb-parameter-param.maxIndexBuildMemoryUsageMegabytes). When using the default [`maxNumActiveUserIndexBuilds`](/docs/manual/reference/parameters#mongodb-parameter-param.maxNumActiveUserIndexBuilds) of 3, the total memory usage for all concurrent index builds can reach up to 3 times the value of [`maxIndexBuildMemoryUsageMegabytes`.](/docs/manual/reference/parameters#mongodb-parameter-param.maxIndexBuildMemoryUsageMegabytes)

If the host machine has limited available free RAM, you may need to schedule a maintenance period to increase the total system RAM before you can modify the `mongod` RAM usage.

## Index Builds in Replicated Environments

**Note: Requires featureCompatibilityVersion 4.4+**

Each [`mongod`](/docs/manual/reference/program/mongod#mongodb-binary-bin.mongod) in the replica set or sharded cluster _must_ have [featureCompatibilityVersion](/docs/manual/reference/command/setFeatureCompatibilityVersion#std-label-set-fcv) set to at least `4.4` to start index builds simultaneously across replica set members.

Index builds on a replica set or sharded cluster build simultaneously across all data-bearing replica set members. For sharded clusters, the index build occurs only on shards containing data for the collection being indexed. The primary requires a minimum number of data-bearing [`voting`](/docs/manual/reference/replica-configuration#mongodb-rsconf-rsconf.members-n-.votes) members (i.e commit quorum), including itself, that must complete the build before marking the index as ready for use.

**Important:**

If a data-bearing voting node becomes unreachable and the [commitQuorum](/docs/manual/reference/command/createIndexes#std-label-createIndexes-cmd-commitQuorum) is set to the default `votingMembers`, index builds can hang until that node comes back online.

The build process is summarized as follows:

1. The primary receives the [`createIndexes`](/docs/manual/reference/command/createIndexes#mongodb-dbcommand-dbcmd.createIndexes) command and immediately creates a "startIndexBuild" oplog entry associated with the index build.

2. The secondaries start the index build after they replicate the "startIndexBuild" oplog entry.

3. Each member "votes" to commit the build once it finishes indexing data in the collection.

4. Secondary members continue to process any new write operations into the index while waiting for the primary to confirm a quorum of votes.

5. When the primary has a quorum of votes, it checks for any key constraint violations such as duplicate key errors.
   - If there are no key constraint violations, the primary completes the index build, marks the index as ready for use, and creates an associated "commitIndexBuild" oplog entry.

   - If there are any key constraint violations, the index build fails. The primary aborts the index build and creates an associated "abortIndexBuild" oplog entry.

6. The secondaries replicate the "commitIndexBuild" oplog entry and complete the index build.

   If the secondaries instead replicate an "abortIndexBuild" oplog entry, they abort the index build and discard the build job.

For sharded clusters, the index build occurs only on shards containing data for the collection being indexed.

For a more detailed description of the index build process, see [Index Build Process.](/docs/manual/core/index-creation#std-label-index-build-process)

By default, index builds use a commit quorum of `"votingMembers"`, or all data-bearing voting members. To start an index build with a non-default commit quorum, specify the [commitQuorum](/docs/manual/reference/command/createIndexes#std-label-createIndexes-cmd-commitQuorum) parameter to [`createIndexes`](/docs/manual/reference/command/createIndexes#mongodb-dbcommand-dbcmd.createIndexes) or its shell helpers [`db.collection.createIndex()`](/docs/manual/reference/method/db.collection.createIndex#mongodb-method-db.collection.createIndex) and [`db.collection.createIndexes()`.](/docs/manual/reference/method/db.collection.createIndexes#mongodb-method-db.collection.createIndexes)

To modify the commit quorum required for an in-progress simultaneous index build, use the [`setIndexCommitQuorum`](/docs/manual/reference/command/setIndexCommitQuorum#mongodb-dbcommand-dbcmd.setIndexCommitQuorum) command.

**Warning:**

Avoid performing rolling index and replicated index build processes concurrently as it might lead to unexpected issues, such as broken builds and crash loops.

**Note:**

Rolling index builds take at most one replica set member at a time, starting with the secondary members, and build the index on that member as a standalone. Rolling index builds require at least one replica set election. Use rolling index builds only if you meet the requirements listed on the [rolling index pages](/docs/manual/core/rolling-index-builds#std-label-rolling-index-build), as the procedure lowers the resiliency of the cluster.

### Commit Quorum Contrasted with Write Concern

There are important differences between [commit quorums](/docs/manual/reference/command/createIndexes#std-label-createIndexes-cmd-commitQuorum) and [write concerns:](/docs/manual/reference/write-concern#std-label-write-concern)

- Index builds use commit quorums.

- Write operations use write concerns.

Each data-bearing node in a cluster is a voting member.

The commit quorum specifies how many data-bearing voting members, or which voting members, including the primary, must be prepared to commit a [simultaneous index build](/docs/manual/core/index-creation#std-label-index-operations-simultaneous-build) before the primary will execute the commit.

The write concern is the level of acknowledgment that the write has propagated to the specified number of instances.

**Changed in version 8.0The commit quorum specifies how many
nodes must be ready to finish the index build before the
primary commits the index build. In contrast, when the
primary has committed the index build, the write concern
specifies how many nodes must replicate the index build oplog
entry before the command returns success.**

In previous releases, when the primary committed the index build, the write concern specified how many nodes must finish the index build before the command returned success.

## Build Failure and Recovery

### Interrupted Index Builds on Primary and Secondary `mongod`

If a primary or secondary `mongod` performs a clean [`shutdown`](/docs/manual/reference/command/shutdown#mongodb-dbcommand-dbcmd.shutdown) with `"force" : true` or receives a `SIGTERM` signal during an index build, and the [commitQuorum](/docs/manual/reference/command/createIndexes#std-label-createIndexes-cmd-commitQuorum) is set to the default `votingMembers`, the index build progress is saved to disk. The `mongod` automatically recovers the index build when restarted and continues from the saved checkpoint.

If the `mongod` crashes instead of shutting down cleanly, the index build cannot resume regardless of the commit quorum setting. The index build restarts from the beginning when the `mongod` comes back online.

An index build can resume from a saved checkpoint only once. If the `mongod` restarts again while that same index build is still in progress, the build restarts from the beginning instead of resuming from a checkpoint.

The `mongod` can perform the startup process while recovering index builds.

If you restart the `mongod` as a standalone (that is, removing or commenting out [`replication.replSetName`](/docs/manual/reference/configuration-options#mongodb-setting-replication.replSetName) or omitting [`--replSetName`](/docs/manual/reference/program/mongod#std-option-mongod.--replSet)), the `mongod` cannot restart the index build. The build remains in a paused state until it is manually [`dropped`.](/docs/manual/reference/command/dropIndexes#mongodb-dbcommand-dbcmd.dropIndexes)

### Interrupted Index Builds on Standalone `mongod`

If the `mongod` shuts down during the index build, the index build job and all progress is lost. Restarting the `mongod` does not restart the index build. You must re-issue the [`createIndex()`](/docs/manual/reference/method/db.collection.createIndex#mongodb-method-db.collection.createIndex) operation to restart the index build.

### Rollbacks during Build Process

Starting in MongoDB 5.0, if a node is rolled back to a prior state during the index build, the index build progress is saved to disk. If there is still work to be done when the rollback concludes, the `mongod` automatically recovers the index build and continues from the saved checkpoint.

MongoDB can pause an in-progress index build to perform a [rollback.](/docs/manual/core/replica-set-rollbacks#std-label-replica-set-rollbacks)

- If the rollback does not revert the index build, MongoDB restarts the index build after completing the rollback.

- If the rollback reverts the index build, you must re-create the index or indexes after the rollback completes.

### Index Consistency Checks for Sharded Collections

A sharded collection has an inconsistent index if the collection does not have the exact same indexes (including the index options) on each shard that contains chunks for the collection. Although inconsistent indexes should not occur during normal operations, they can occur in the following scenarios:

- When creating an index with a `unique` key constraint and one shard contains a chunk with duplicate documents. In such cases, the create index operation may succeed on the shards without duplicates but not on the shard with duplicates.

- When creating an index across the shards in a [rolling manner](/docs/manual/tutorial/build-indexes-on-sharded-clusters#std-label-index-build-on-sharded-clusters) (that is, manually building the index one by one across the shards) but either fails to build the index for an associated shard or incorrectly builds an index with different specification.

The [config server](/docs/manual/core/sharded-cluster-config-servers#std-label-sharding-config-server) primary periodically checks for index inconsistencies across the shards for sharded collections. To configure these periodic checks, see [`enableShardedIndexConsistencyCheck`](/docs/manual/reference/parameters#mongodb-parameter-param.enableShardedIndexConsistencyCheck) and [`shardedIndexConsistencyCheckIntervalMS`.](/docs/manual/reference/parameters#mongodb-parameter-param.shardedIndexConsistencyCheckIntervalMS)

The command [`serverStatus`](/docs/manual/reference/command/serverStatus#mongodb-dbcommand-dbcmd.serverStatus) returns the field [`shardedIndexConsistency`](/docs/manual/reference/command/serverStatus#mongodb-serverstatus-serverstatus.shardedIndexConsistency) to report on index inconsistencies when run on the config server primary.

To check if a sharded collection has inconsistent indexes, see [Find Inconsistent Indexes Across Shards.](/docs/manual/tutorial/manage-indexes#std-label-manage-indexes-find-inconsistent-indexes)

## Monitor In Progress Index Builds

To see the status of an index build operation, you can use the [`db.currentOp()`](/docs/manual/reference/method/db.currentOp#mongodb-method-db.currentOp) method in [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh). To filter the current operations for index creation operations, see [Active Indexing Operations](/docs/manual/reference/method/db.currentOp#std-label-currentOp-index-creation) for an example.

The [`msg`](/docs/manual/reference/operator/aggregation/currentOp#mongodb-data--currentOp.msg) field includes a percentage-complete measurement of the current stage in the index build process.

### Observe Stopped and Resumed Index Builds in the Logs

While an index is being built, progress is written to the [MongoDB log](/docs/manual/reference/log-messages#std-label-log-messages-ref). If an index build is stopped and resumed there will be log messages with fields like these:

```bash
 "msg":"Index build: wrote resumable state to disk",

 "msg":"Found index from unfinished build",
```

## Terminate In Progress Index Builds

Use the [`dropIndexes`](/docs/manual/reference/command/dropIndexes#mongodb-dbcommand-dbcmd.dropIndexes) command or its shell helpers [`dropIndex()`](/docs/manual/reference/method/db.collection.dropIndex#mongodb-method-db.collection.dropIndex) or [`dropIndexes()`](/docs/manual/reference/method/db.collection.dropIndexes#mongodb-method-db.collection.dropIndexes) to terminate an in-progress index build. See [Stop In-Progress Index Builds](/docs/manual/reference/command/dropIndexes#std-label-dropIndexes-cmd-index-builds) for more information.

Do _not_ use [`killOp`](/docs/manual/reference/command/killOp#mongodb-dbcommand-dbcmd.killOp) to terminate an in-progress index builds in replica sets or sharded clusters.

## Index Build Process

The following table describes each stage of the index build process:

| Stage                                         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lock                                          | The `mongod` obtains an exclusive `X` lock on the the collection being indexed. This blocks all read and write operations on the collection, including the application of any replicated write operations or metadata commands that target the collection. The `mongod` does not yield this lock.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Initialization                                | The `mongod` creates three data structures at this initial state: The initial index metadata entry.; A temporary table ("side writes table") that stores keys generated from writes to the collection being indexed during the build process.; A temporary table ("constraint violation table") for all documents that may cause a key generation error. Key generation errors occur when a document has invalid keys for the indexed fields. For example, a document with duplicate field values when building a [unique index](/docs/manual/core/index-unique#std-label-index-type-unique) _or_ malformed [GeoJSON objects](/docs/manual/geospatial-queries#std-label-geospatial-geojson) when building a [2dsphere index.](/docs/manual/core/indexes/index-types/geospatial/2dsphere#std-label-2dsphere-index)                                                                                                                                                                                                                                                                                                                                                                 |
| Lock                                          | The `mongod` downgrades the exclusive `X` collection lock to an intent exclusive `IX` lock. The `mongod` periodically yields this lock to interleaving read and write operations.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Scan Collection                               | For each document in the collection, the `mongod` generates a key for that document and dumps the key into an external sorter. If the `mongod` encounters a key generation error while generating a key during the collection scan, it stores that key in the constraint violation table for later processing. If the `mongod` encounters any other error while generating a key, the build fails with an error. Once the `mongod` completes the collection scan, it dumps the sorted keys into the index.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Process Side Writes Table                     | The `mongod` drains the side write table using first-in-first-out priority. If the `mongod` encounters a key generation error while processing a key in the side write table, it stores that key in the constraint violation table for later processing. If the `mongod` encounters any other error while processing a key, the build fails with an error. For each document written to the collection during the build process, the `mongod` generates a key for that document and stores it in the side write table for later processing. The `mongod` uses a snapshot system to set a limit to the number of keys to process.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Vote and Wait for Commit Quorum               | A `mongod` that is _not_ part of a replica set skips this stage. The `mongod` submits a "vote" to the primary to commit the index. Specifically, it writes the "vote" to an internal replicated collection on the [primary.](/docs/manual/reference/glossary#std-term-primary) If the `mongod` is the [primary](/docs/manual/reference/glossary#std-term-primary), it waits until it has a commit quorum of votes (all voting data-bearing members by default) before continuing the index build process. If the `mongod` is a [secondary](/docs/manual/reference/glossary#std-term-secondary), it waits until it replicates either a "commitIndexBuild" or "abortIndexBuild" oplog entry: If the `mongod` replicates a "commitIndexBuild" oplog entry, it finishes draining the side writes table and moves to the next stage in the index build process.; If the `mongod` replicates an "abortIndexBuild" oplog entry, it aborts the index build and discards the build job. While waiting for commit quorum, the `mongod` adds any additional keys generated from write operations to the collection being indexed to the side writes table and periodically drains the table. |
| Lock                                          | The `mongod` upgrades the intent exclusive `IX` lock on the collection to a shared `S` lock. This blocks all write operations to the collection, including the application of any replicated write operations or metadata commands that target the collection.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Finish Processing Temporary Side Writes Table | The `mongod` continues draining remaining records in the side writes table. The `mongod` may pause replication during this stage. If the `mongod` encounters a key generation error while processing a key in the side write table, it stores that key in the constraint violation table for later processing. If the `mongod` encounters any other error while processing a key, the build fails with an error.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Lock                                          | The `mongod` upgrades the shared `S` lock on the collection to an exclusive `X` lock on the collection. This blocks all read and write operations on the collection, including the application of any replicated write operations or metadata commands that target the collection. The `mongod` does not yield this lock.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Drop Side Write Table                         | The `mongod` applies any remaining operations in the side writes table before dropping it. If the `mongod` encounters a key generation error while processing a key in the side write table, it stores that key in the constraint violation table for later processing. If the `mongod` encounters any other error while processing a key, the build fails with an error. At this point, the index includes all data written to the collection.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Process Constraint Violation Table            | If the `mongod` is the [primary](/docs/manual/reference/glossary#std-term-primary), it drains the constraint violation table using first-in-first-out priority. If no keys in the constraint violation table produce a key generation error _or_ if the table is empty, the `mongod` drops the table and creates a "commitIndexBuild" oplog entry. Secondaries can complete the associated index build after replicating the oplog entry.; If any key in the constraint violation table still produces a key generation error, the `mongod` aborts the build and throws an error. The `mongod` creates an associated "abortIndexBuild" oplog entry to indicate that secondaries should abort and discard the index build job. If the `mongod` is a [secondary](/docs/manual/reference/glossary#std-term-secondary), it drops the constraint violation table. Since the primary _must_ successfully drain the constraint violation table prior to creating the "commitOplogEntry" oplog entry, the secondary can safely assume that no violations exist.                                                                                                                           |
| Mark the Index as Ready                       | The `mongod` updates the index metadata to mark the index as ready for use.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Lock                                          | The `mongod` releases the `X` lock on the collection.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

**See also:**

[FAQ: Concurrency](/docs/manual/faq/concurrency#std-label-faq-concurrency)
