
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { StorageDriver } from '../../types';

export function createLocalStorageDriver(baseDir: string): StorageDriver {
  const root = path.resolve(baseDir);
  if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true });

  return {
    getPublicUrl: (key) => null, // local storage is private in dev
    async createPresignedPut(key, _contentType, _expiresSeconds) {
      // For local dev we simulate pre-signed URLs by generating a one-time
      // token and exposing a temporary upload endpoint handled in server.
      const token = randomUUID();
      const url = `/uploads/local/${encodeURIComponent(key)}?token=${token}`;
      return { url, headers: { 'x-local-upload-token': token } };
    },
    async delete(key) {
      const file = path.join(root, key);
      if (fs.existsSync(file)) await fs.promises.unlink(file);
    }
  }
}
