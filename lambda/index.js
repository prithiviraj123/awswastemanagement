const AWS = require('aws-sdk');

// Initialize AWS clients
const ec2 = new AWS.EC2();
const rds = new AWS.RDS();

async function getEC2Resources() {
  const instances = await ec2.describeInstances({
    Filters: [
      { Name: 'instance-state-name', Values: ['stopped'] }
    ]
  }).promise();

  return instances.Reservations.flatMap(reservation =>
    reservation.Instances.map(instance => ({
      id: instance.InstanceId,
      type: 'EC2',
      name: instance.Tags.find(tag => tag.Key === 'Name')?.Value || instance.InstanceId,
      region: process.env.AWS_REGION,
      state: instance.State.Name,
      lastUsed: instance.LaunchTime,
      cost: 0,
      details: {
        instanceType: instance.InstanceType
      }
    }))
  );
}

async function getRDSResources() {
  const instances = await rds.describeDBInstances().promise();

  return instances.DBInstances
    .filter(instance => instance.DBInstanceStatus === 'stopped')
    .map(instance => ({
      id: instance.DBInstanceIdentifier,
      type: 'RDS',
      name: instance.DBInstanceIdentifier,
      region: process.env.AWS_REGION,
      state: instance.DBInstanceStatus,
      lastUsed: instance.InstanceCreateTime,
      cost: 0,
      details: {
        instanceType: instance.DBInstanceClass,
        engine: instance.Engine
      }
    }));
}

async function getEBSResources() {
  const volumes = await ec2.describeVolumes({
    Filters: [
      { Name: 'status', Values: ['available'] }
    ]
  }).promise();

  return volumes.Volumes.map(volume => ({
    id: volume.VolumeId,
    type: 'EBS',
    name: volume.Tags?.find(tag => tag.Key === 'Name')?.Value || volume.VolumeId,
    region: process.env.AWS_REGION,
    state: volume.State,
    lastUsed: volume.CreateTime,
    cost: 0,
    details: {
      volumeSize: volume.Size,
      volumeType: volume.VolumeType
    }
  }));
}

async function getSnapshots() {
  const snapshots = await ec2.describeSnapshots({
    OwnerIds: ['self']
  }).promise();

  return snapshots.Snapshots.map(snapshot => ({
    id: snapshot.SnapshotId,
    type: 'SNAPSHOT',
    name: snapshot.Tags?.find(tag => tag.Key === 'Name')?.Value || snapshot.SnapshotId,
    region: process.env.AWS_REGION,
    state: snapshot.State,
    lastUsed: snapshot.StartTime,
    cost: 0,
    details: {
      snapshotSize: snapshot.VolumeSize
    }
  }));
}

exports.handler = async (event, context) => {
  // Handle different HTTP methods
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;

  try {
    if (httpMethod === 'GET') {
      // Fetch all resources in parallel
      const [ec2Resources, rdsResources, ebsResources, snapshotResources] = await Promise.all([
        getEC2Resources(),
        getRDSResources(),
        getEBSResources(),
        getSnapshots()
      ]);

      const allResources = [
        ...ec2Resources,
        ...rdsResources,
        ...ebsResources,
        ...snapshotResources
      ];

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resources: allResources
        })
      };
    } else if (httpMethod === 'DELETE') {
      const resourceId = event.pathParameters?.id;
      if (!resourceId) {
        throw new Error('Resource ID is required');
      }

      // Implement resource deletion logic here
      // You'll need to determine the resource type and use the appropriate AWS SDK call

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Resource ${resourceId} deleted successfully`
        })
      };
    } else if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json'
        },
        body: ''
      };
    }

    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Method not allowed'
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message || 'Internal server error'
      })
    };
  }
};