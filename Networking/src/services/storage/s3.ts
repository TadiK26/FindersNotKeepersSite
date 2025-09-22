
// Minimal S3 client using AWS SDK v3; you can plug actual SDK when ready.
// Here we keep interface and leave as TODO to avoid bundling AWS libs by default.
import type { StorageDriver } from '../../types';

export function createS3StorageDriver(_cfg: { bucket: string; region: string; accessKeyId: string; secretAccessKey: string; }): StorageDriver {
  return {
    getPublicUrl(key) {
      // If your bucket is public-read via CDN, return the CDN URL here
      return null;
    },
    async createPresignedPut(_key, _contentType, _expiresSeconds) {
      // TODO: implement with @aws-sdk/s3-request-presigner
      throw new Error('S3 driver not wired yet. Switch STORAGE_DRIVER=local for dev.');
    },
    async delete(_key) {
      // TODO
    }
  }
}
