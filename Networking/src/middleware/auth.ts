
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { Env } from '../types';

export function auth(env: Env) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authz = req.headers.authorization ?? '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });
    try {
      const payload = jwt.verify(token, env.JWT.SECRET, {
        audience: env.JWT.AUDIENCE,
        issuer: env.JWT.ISSUER
      });
      (req as any).user = payload;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
}
