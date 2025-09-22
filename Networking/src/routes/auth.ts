
import { Router } from 'express';
import { ah } from '../utils/asyncHandler';
import { memoryUserRepo } from '../repo/memoryUserRepo';
import type { Env, EmailDriver } from '../types';
import { createTokenService } from '../services/tokens';

export function authRoutes(env: Env, email: EmailDriver) {
  const r = Router();
  const tokens = createTokenService(env);

  r.post('/register', ah(async (req, res) => {
    const { email: em, password } = req.body as any;
    if (!em || !password) return res.status(400).json({ error: 'email and password required' });
    const exists = await memoryUserRepo.findByEmail(em);
    if (exists) return res.status(409).json({ error: 'email exists' });
    const u = await memoryUserRepo.create(em, password);
    const verifyLink = `https://example.invalid/verify/${u.id}`; // Replace with real link
    await email.send(u.email, 'Verify your email', `<p>Click <a href="${verifyLink}">verify</a></p>`);
    res.status(201).json({ id: u.id, email: u.email });
  }));

  r.post('/login', ah(async (req, res) => {
    const { email: em, password } = req.body as any;
    const u = await memoryUserRepo.validate(em, password);
    if (!u) return res.status(401).json({ error: 'invalid credentials' });
    const access = tokens.signAccess(u.id);
    const refresh = tokens.signRefresh(u.id);
    res.json({ access, refresh });
  }));

  r.post('/refresh', ah(async (req, res) => {
    // For demo, just issue a new access token from a refresh token if signature is valid
    // In production, store and rotate refresh tokens.
    const { refresh } = req.body as any;
    if (!refresh) return res.status(400).json({ error: 'refresh required' });
    try {
      const payload = (await import('jsonwebtoken')).verify(refresh, env.JWT.SECRET, { audience: env.JWT.AUDIENCE, issuer: env.JWT.ISSUER }) as any;
      if (payload.typ !== 'refresh') throw new Error('wrong token type');
      const access = createTokenService(env).signAccess(payload.sub);
      res.json({ access });
    } catch (e) {
      res.status(401).json({ error: 'invalid refresh' });
    }
  }));

  return r;
}
