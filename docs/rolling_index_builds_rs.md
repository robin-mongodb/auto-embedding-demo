> For the complete MongoDB documentation index, see www.mongodb.com/docs/llms.txt

<!--
Tab options on this page. Append to the .md URL to filter:
  ?tabs=<id,...>   select specific tabs (e.g. ?tabs=nodejs,shell)
  ?allTabs=true    include every tab
  (no param)       default: one tab per tabset

Available tabs:
  other tabs: config-file, command-line
-->

# Create a Rolling Index Build on Replica Sets

## About this Task

Rolling index builds are an alternative to [default index builds.](/docs/manual/core/index-creation#std-label-index-operations)

Only use a [rolling index build](/docs/manual/core/rolling-index-builds#std-label-rolling-index-build) if your deployment matches one of the following cases:

- If your average CPU utilization exceeds (N-1)/N-10% where where N is the number of CPU threads available to mongod

- If your WiredTiger cache fill ratio regularly exceeds 90%

**Warning:**

Avoid performing rolling index and replicated index build processes concurrently as it might lead to unexpected issues, such as broken builds and crash loops.

**Note:**

If your deployment does not meet this criteria, use the [default index build.](/docs/manual/core/index-creation#std-label-index-operations)

**Tip:**

With Atlas, you can temporarily [scale](https://www.mongodb.com/docs/atlas/scale-cluster/) your cluster to meet the requirements for a traditional index build. However, Atlas charges to scale your cluster. See [Cluster Configuration Costs](https://www.mongodb.com/docs/atlas/billing/cluster-configuration-costs/) for more information.

## Considerations

### Unique Indexes

To create [unique indexes](/docs/manual/core/index-unique#std-label-index-type-unique) using the following procedure, you must stop all writes to the collection during this procedure.

If you cannot stop all writes to the collection during this procedure, do not use the procedure on this page. Instead, build your unique index on the collection by issuing [`db.collection.createIndex()`](/docs/manual/reference/method/db.collection.createIndex#mongodb-method-db.collection.createIndex) on the primary for a replica set.

### Oplog Size

Ensure that your [oplog](/docs/manual/reference/glossary#std-term-oplog) is large enough to permit the indexing or re-indexing operation to complete without falling too far behind to catch up. See the [oplog sizing](/docs/manual/core/replica-set-oplog#std-label-replica-set-oplog-sizing) documentation for additional information.

Rolling index builds lower the resiliency of your cluster and increase build duration.

## Prerequisites

For building unique indexes

To create [unique indexes](/docs/manual/core/index-unique#std-label-index-type-unique) using the following procedure, you must stop all writes to the collection during the index build. Otherwise, you may end up with inconsistent data across the replica set members.

**Warning:**

If you cannot stop all writes to the collection, do not use the following procedure to create unique indexes.

## Procedure

**Important:**

The following procedure to build indexes in a rolling fashion applies to replica set deployments, and not sharded clusters. For the procedure for sharded clusters, see [Create Rolling Index Builds on Sharded Clusters](/docs/manual/tutorial/build-indexes-on-sharded-clusters) instead.

### 1. Hide and Restart One Secondary.

Run the following commands on your primary node to hide the secondary that will build the new index.

In this example, the secondary that will build the new index is the third node in `cfg.members`.

```bash
var cfg = rs.conf();
// Record originalPriority so that you can reset it later.
var originalPriority = cfg.members[2].priority;
cfg.members[2].priority = 0;
cfg.members[2].hidden = 1;
rs.reconfig(cfg);
```

### 2. Stop One Secondary and Restart as a Standalone.

Stop the [`mongod`](/docs/manual/reference/program/mongod#mongodb-binary-bin.mongod) process associated with a secondary. Restart after making the following configuration updates:

### Configuration File

If you are using a configuration file, make the following configuration updates:

- Comment out the [`replication.replSetName`](/docs/manual/reference/configuration-options#mongodb-setting-replication.replSetName) option.

- Change the [`net.port`](/docs/manual/reference/configuration-options#mongodb-setting-net.port) to a different port. Make a note of the original port setting as a comment.

- Set parameter `disableLogicalSessionCacheRefresh` to `true` in the [`setParameter`](/docs/manual/reference/configuration-options#mongodb-setting-setParameter) section.

For example, the updated configuration file for a replica set member will include content like the following example:

```yaml
net:
  bindIp: localhost,<hostname(s)|ip address(es)>
  port: 27217
#   port: 27017
#replication:
#   replSetName: myRepl
setParameter:
  disableLogicalSessionCacheRefresh: true
```

Other settings (e.g. [`storage.dbPath`](/docs/manual/reference/configuration-options#mongodb-setting-storage.dbPath), etc.) remain the same.

And restart:

```bash
mongod --config <path/To/ConfigFile>
```

By running the [`mongod`](/docs/manual/reference/program/mongod#mongodb-binary-bin.mongod) on a different port, you ensure that the other members of the replica set and all clients will not contact the member while you are building the index.

### 3. Build the Index.

Connect directly to the [`mongod`](/docs/manual/reference/program/mongod#mongodb-binary-bin.mongod) instance running as a standalone on the new port and create the new index for this instance.

For example, connect [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh) to the instance, and use the [`createIndex()`](/docs/manual/reference/method/db.collection.createIndex#mongodb-method-db.collection.createIndex) to create an ascending index on the `username` field of the `records` collection:

```bash
db.records.createIndex( { username: 1 } )
```

### 4. Restart the Program `mongod` as a Replica Set Member.

When the index build completes, shutdown the [`mongod`](/docs/manual/reference/program/mongod#mongodb-binary-bin.mongod) instance. To return the node to its original configuration, undo the configuration changes that you made when you started the node as a standalone. Then, restart the node as a member of the replica set.

**Important:**

Be sure to remove the `disableLogicalSessionCacheRefresh` parameter.

For example, to restart your replica set member:

### Configuration File

If you are using a configuration file:

- Revert to the original port number.

- Uncomment the [`replication.replSetName`.](/docs/manual/reference/configuration-options#mongodb-setting-replication.replSetName)

- Remove parameter `disableLogicalSessionCacheRefresh` in the [`setParameter`](/docs/manual/reference/configuration-options#mongodb-setting-setParameter) section.

For example:

```yaml
net:
  bindIp: localhost,<hostname(s)|ip address(es)>
  port: 27017
replication:
  replSetName: myRepl
```

Other settings (e.g. [`storage.dbPath`](/docs/manual/reference/configuration-options#mongodb-setting-storage.dbPath), etc.) remain the same.

And restart:

```bash
mongod --config <path/To/ConfigFile>
```

**Important:**

Allow replication to catch up on this member before you begin the next step.

### 5. Unhide the Secondary.

Run the following command on your primary to unhide the secondary node that built the index. In this example, the secondary node that built the index is the third node in `cfg.members`.

```bash
var cfg = rs.conf();
cfg.members[2].priority = originalPriority;
cfg.members[2].hidden = false;
rs.reconfig(cfg);
```

### 6. Repeat the Procedure for the Remaining Secondaries.

Once the member catches up with the other members of the set, repeat the procedure one member at a time for the remaining secondary members:

[Hide and restart one secondary.](/docs/manual/tutorial/build-indexes-on-replica-sets#std-label-tutorial-index-on-replica-sets-stop-one-member)

[Build the index.](/docs/manual/tutorial/build-indexes-on-replica-sets#std-label-tutorial-index-on-replica-sets-build-index)

[Restart the Program mongod as a replica set member.](/docs/manual/tutorial/build-indexes-on-replica-sets#std-label-tutorial-index-on-replica-sets-restart-mongod)

### 7. Build the Index on the Primary.

When all the secondaries have the new index, step down the primary, restart it as a standalone using the procedure described above, and build the index on the former primary:

Use the [`rs.stepDown()`](/docs/manual/reference/method/rs.stepDown#mongodb-method-rs.stepDown) method in [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh) to step down the primary. Upon successful stepdown, the current primary becomes a secondary and the replica set members elect a new primary.

[Hide and restart one secondary.](/docs/manual/tutorial/build-indexes-on-replica-sets#std-label-tutorial-index-on-replica-sets-stop-one-member)

[Build the index.](/docs/manual/tutorial/build-indexes-on-replica-sets#std-label-tutorial-index-on-replica-sets-build-index)

[Restart the Program mongod as a replica set member.](/docs/manual/tutorial/build-indexes-on-replica-sets#std-label-tutorial-index-on-replica-sets-restart-mongod)
