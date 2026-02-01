import { s3 } from '@/lib/storage/s3';
import * as fs from 'fs';
import { pipeline } from 'stream/promises';

export type MediaType = 'video' | 'image' | 'audio' | 'unknown';

/**
 * Determines the category of media based on its MIME type.
 */
export const getMediaType = (mimeType: string): MediaType => {
  if (!mimeType) return 'unknown';

  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';

  return 'unknown';
};

/**
 * Downloads a file from S3 to a local path using streams.
 */
export const downloadFile = async (s3Key: string, localPath: string): Promise<void> => {
  console.log(`[Utils] Downloading ${s3Key} to ${localPath}`);
  const stream = await s3.getObjectStream(s3Key);
  await pipeline(stream, fs.createWriteStream(localPath));
};

/**
 * Uploads a local file to S3 using streams.
 */
export const uploadFile = async (
  localPath: string,
  s3Key: string,
  contentType: string,
): Promise<string> => {
  console.log(`[Utils] Uploading ${localPath} to ${s3Key}`);
  const fileStream = fs.createReadStream(localPath);
  return s3.uploadStream(s3Key, fileStream, contentType);
};
