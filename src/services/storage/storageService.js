/* eslint-disable import/no-extraneous-dependencies */
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import r2Client from '../../config/r2storage/R2Client.js';

class S3Service {
  constructor(bucketName) {
    this.bucketName = bucketName;
  }

  /**
   * Generate signed URL untuk GET object
   */
  async getSignedUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(r2Client, command, { expiresIn });
  }

  /**
   * Generate signed URL untuk PUT object (upload)
   */
  async getUploadUrl(key, body, contentType, expiresIn = 3600) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType, // bisa diganti dinamis
    });

    return getSignedUrl(r2Client, command, { expiresIn });
  }

  // StorageService.js
  async uploadObject(key, body, contentType) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await r2Client.send(command);
    return {
      key,
      url: `https://${this.bucketName}.${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${key}`,
    };
  }
}

export default S3Service;
