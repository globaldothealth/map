import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { Stack } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';

const backend = defineBackend({
  auth,
});

const storageStack = backend.createStack('ExistingStorageStack');
const existingBucket = s3.Bucket.fromBucketName(
  storageStack,
  'AggregatedMapData',
  'aggregated-map-data'
);

// Grant the Cognito unauthenticated (guest) role access to the existing bucket
const unauthRole = backend.auth.resources.unauthenticatedUserIamRole;
existingBucket.grantRead(unauthRole, 'outbreaks/*');
existingBucket.grantRead(unauthRole, 'metadata/*');

// Set CORS on the existing bucket to allow browser requests
new AwsCustomResource(storageStack, 'BucketCors', {
  onUpdate: {
    service: 'S3',
    action: 'putBucketCors',
    parameters: {
      Bucket: existingBucket.bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    },
    physicalResourceId: PhysicalResourceId.of(`${existingBucket.bucketName}-cors`),
  },
  policy: AwsCustomResourcePolicy.fromStatements([
    new iam.PolicyStatement({
      actions: ['s3:PutBucketCors'],
      resources: [`arn:aws:s3:::${existingBucket.bucketName}`],
    }),
  ]),
});

backend.addOutput({
  storage: {
    aws_region: Stack.of(storageStack).region,
    bucket_name: existingBucket.bucketName,
    buckets: [
      {
        name: 'aggregated-map-data',
        bucket_name: existingBucket.bucketName,
        aws_region: Stack.of(storageStack).region,
        paths: {
          'outbreaks/*': {
            guest: ['get', 'list'],
          },
          'metadata/*': {
            guest: ['get', 'list'],
          },
        },
      },
    ],
  },
});
