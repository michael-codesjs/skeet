import * as cdk from 'aws-cdk-lib';
import { StorageStack } from './lib/storage';

const app = new cdk.App();

const stage = process.env.STAGE || 'dev';

new StorageStack(app, `SkeetStorageStack-${stage}`, {
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
