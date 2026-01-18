import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
});

// Assuming stage is dev if not specified. Infrastructure uses skeet-{stage}
const STAGE = process.env.STAGE || 'dev';
const BUCKET_NAME = process.env.STORAGE_BUCKET || `skeet-${STAGE}`;

export const getUploadUrl = async (key: string, contentType: string) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
};

export const getDownloadUrl = (key: string) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
};
