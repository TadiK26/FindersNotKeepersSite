
import { Router } from 'express';
import { ah } from '../utils/asyncHandler';
import type { Env, StorageDriver } from '../types';
import { auth as authMw } from '../middleware/auth';

// Simple in-memory listings for demo; swap to DB later
interface Listing { id: string; ownerId: string; title: string; description?: string; imageKey?: string; createdAt: string; }
const listings = new Map<string, Listing>();

export function listingRoutes(env: Env, storage: StorageDriver) {
  const r = Router();
  const requireAuth = authMw(env);

  r.get('/', ah(async (req, res) => {
    // Public search (later add pagination, filtering, caching)
    const all = [...listings.values()];
    res.json({ items: all });
  }));

  r.post('/', requireAuth, ah(async (req, res) => {
    const { title, description, imageKey } = req.body as any;
    if (!title) return res.status(400).json({ error: 'title required' });
    const id = crypto.randomUUID();
    const ownerId = (req as any).user.sub as string;
    const li: Listing = { id, ownerId, title, description, imageKey, createdAt: new Date().toISOString() };
    listings.set(id, li);
    res.status(201).json(li);
  }));

  r.get('/:id', ah(async (req, res) => {
    const li = listings.get(req.params.id);
    if (!li) return res.status(404).json({ error: 'not found' });
    // Provide image URL if storage supports it
    const imageUrl = li.imageKey ? storage.getPublicUrl(li.imageKey) : null;
    res.json({ ...li, imageUrl });
  }));

  r.delete('/:id', requireAuth, ah(async (req, res) => {
    const li = listings.get(req.params.id);
    if (!li) return res.status(404).json({ error: 'not found' });
    const userId = (req as any).user.sub as string;
    if (li.ownerId !== userId) return res.status(403).json({ error: 'forbidden' });
    if (li.imageKey) await storage.delete(li.imageKey);
    listings.delete(req.params.id);
    res.status(204).end();
  }));

  return r;
}
