/* eslint-disable import/no-extraneous-dependencies */
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import S3Service from '../storageService.js';
import r2Client from '../../../config/r2storage/R2Client.js';

// --- Mock semua dependensi eksternal ---
jest.mock('@aws-sdk/client-s3', () => ({
  GetObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock('../../../config/r2storage/R2Client.js', () => ({
  send: jest.fn(),
}));

describe('S3Service', () => {
  const bucketName = 'test-bucket';
  let s3Service;

  beforeEach(() => {
    s3Service = new S3Service(bucketName);
    process.env.CLOUDFLARE_ACCOUNT_ID = 'mock-account-id';
    jest.clearAllMocks();
  });

  describe('getSignedUrl (GET)', () => {
    it('should generate signed URL for GET object', async () => {
      getSignedUrl.mockResolvedValue('https://signed-get-url');
      GetObjectCommand.mockImplementation((params) => params);

      const url = await s3Service.getSignedUrl('test-key');

      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: bucketName,
        Key: 'test-key',
      });
      expect(getSignedUrl).toHaveBeenCalledWith(
        r2Client,
        expect.objectContaining({ Bucket: bucketName, Key: 'test-key' }),
        { expiresIn: 3600 },
      );
      expect(url).toBe('https://signed-get-url');
    });
  });

  describe('getUploadUrl (PUT)', () => {
    it('should generate signed URL for PUT object (upload)', async () => {
      getSignedUrl.mockResolvedValue('https://signed-put-url');
      PutObjectCommand.mockImplementation((params) => params);

      const url = await s3Service.getUploadUrl('upload-key', 'file-data', 'image/png', 1800);

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: bucketName,
        Key: 'upload-key',
        Body: 'file-data',
        ContentType: 'image/png',
      });
      expect(getSignedUrl).toHaveBeenCalledWith(
        r2Client,
        expect.objectContaining({ Bucket: bucketName, Key: 'upload-key' }),
        { expiresIn: 1800 },
      );
      expect(url).toBe('https://signed-put-url');
    });
  });

  describe('uploadObject', () => {
    it('should upload object and return its URL', async () => {
      r2Client.send.mockResolvedValue({}); // simulasi sukses upload
      PutObjectCommand.mockImplementation((params) => params);

      const result = await s3Service.uploadObject('photo.jpg', 'binarydata', 'image/jpeg');

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: bucketName,
        Key: 'photo.jpg',
        Body: 'binarydata',
        ContentType: 'image/jpeg',
      });
      expect(r2Client.send).toHaveBeenCalled();
      expect(result).toEqual({
        key: 'photo.jpg',
        url: `https://${bucketName}.mock-account-id.r2.dev/photo.jpg`,
      });
    });

    it('should throw if r2Client.send fails', async () => {
      r2Client.send.mockRejectedValue(new Error('Upload failed'));
      PutObjectCommand.mockImplementation((params) => params);

      await expect(
        s3Service.uploadObject('file.txt', 'content', 'text/plain'),
      ).rejects.toThrow('Upload failed');
    });
  });
});
