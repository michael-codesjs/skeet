import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

export class S3Service {
  private static instance: S3Service;
  private s3: S3Client;
  private bucketName: string;

  private constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'eu-central-1',
    });

    // Assuming stage is dev if not specified. Infrastructure uses skeet-media-{stage}
    const STAGE = process.env.STAGE || 'dev';
    this.bucketName = process.env.STORAGE_BUCKET || `skeet-media-${STAGE}`;
  }

  public static getInstance(): S3Service {
    if (!S3Service.instance) {
      S3Service.instance = new S3Service();
    }
    return S3Service.instance;
  }

  public getClient(): S3Client {
    return this.s3;
  }

  public getBucketName(): string {
    return this.bucketName;
  }

  public async getUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }

  public async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  /**
   * Get a readable stream of an S3 object for processing
   */
  public async getObjectStream(key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3.send(command);

    if (!response.Body) {
      throw new Error(`Failed to get object body for key: ${key}`);
    }

    // response.Body is a Readable stream in Node.js
    return response.Body as Readable;
  }

  /**
   * Upload a buffer to S3
   */
  public async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3.send(command);

    // Return the public URL (or use CloudFront if configured)
    return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'eu-central-1'}.amazonaws.com/${key}`;
  }

  /**
   * Upload a stream to S3
   */
  public async uploadStream(key: string, stream: Readable, contentType: string): Promise<string> {
    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: stream,
        ContentType: contentType,
      },
    });

    await upload.done();

    // Return the public URL (or use CloudFront if configured)
    return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'eu-central-1'}.amazonaws.com/${key}`;
  }

  /**
   * Check if a file exists in S3
   */
  public async checkFileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Delete a file from S3
   */
  public async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    await this.s3.send(command);
  }
}

export const s3 = S3Service.getInstance();
