
import { Router } from 'express';
import { ah } from '../utils/asyncHandler';
import type { Env, StorageDriver } from '../types';
import { randomUUID } from 'crypto';

export function publicRoutes(env: Env, storage: StorageDriver) {
  const r = Router();

  r.get('/health', (req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV, time: new Date().toISOString() });
  });

  // Request a presigned upload (returns URL + headers). In prod with S3, this is a real pre-signed PUT.
  r.post('/uploads/presign', ah(async (req, res) => {
    const { contentType, ext } = req.body as { contentType?: string; ext?: string };
    if (!contentType) return res.status(400).json({ error: 'contentType required' });
    const key = `${new Date().toISOString().slice(0,10)}/${randomUUID()}${ext ? '.'+ext.replace(/^\./,'') : ''}`;
    const signed = await storage.createPresignedPut(key, contentType, 300);
    res.json({ key, ...signed });
  }));

  return r;
}
