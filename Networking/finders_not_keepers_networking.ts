// =============================
// FILE: package.json
// =============================
{
  "name": "fnk-networking-service",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "build": "tsc -p ."
  },
  "dependencies": {
    "@hapi/boom": "^10.0.1",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.4.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mailparser": "^3.7.1",
    "multer": "^1.4.5-lts.1",
    "morgan": "^1.10.0",
    "nodemailer": "^6.9.12",
    "pino": "^9.3.1",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/morgan": "^1.9.9",
    "@types/node": "^22.5.4",
    "tsx": "^4.19.1",
    "typescript": "^5.6.2"
  }
}

// =============================
// FILE: tsconfig.json
// =============================
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Node",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}

// =============================
// FILE: .env.example
// =============================
# Core
PORT=8080
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
HSTS_ENABLED=true
REQUEST_BODY_LIMIT_MB=6

# JWT
JWT_ISSUER=fnk.network
JWT_AUDIENCE=fnk.web
JWT_ACCESS_TTL=3600
JWT_REFRESH_TTL=1209600
JWT_SECRET=dev_only_replace_me

# Storage (choose one)
STORAGE_DRIVER=local # "s3" or "local"
LOCAL_STORAGE_DIR=.uploads
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# Email (choose one)
EMAIL_DRIVER=console # "smtp" or "console"
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="FindersNotKeepers <no-reply@fnk.app>"

# Admin
ADMIN_IP_ALLOWLIST=127.0.0.1/32

// =============================
// FILE: src/types.d.ts
// =============================
export type Env = ReturnType<typeof import('./config').loadEnv>;

export interface StorageDriver {
  getPublicUrl(key: string): string | null;
  createPresignedPut(key: string, contentType: string, expiresSeconds: number): Promise<{ url: string; headers?: Record<string,string> }>; 
  delete(key: string): Promise<void>;
}

export interface EmailDriver {
  send(to: string, subject: string, html: string, text?: string): Promise<void>;
}

// Basic user model for demo; replace with DB later
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  createdAt: string;
}

// =============================
// FILE: src/config.ts
// =============================
import dotenv from 'dotenv';

export function loadEnv() {
  dotenv.config();
  const env = process.env;

  function bool(v: string | undefined, def = false) { return v ? /^(1|true|yes|on)$/i.test(v) : def; }
  function num(v: string | undefined, def: number) { const n = Number(v); return Number.isFinite(n) ? n : def; }

  const ALLOWED_ORIGINS = (env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);

  return {
    NODE_ENV: env.NODE_ENV ?? 'development',
    PORT: num(env.PORT, 8080),
    ALLOWED_ORIGINS,
    HSTS_ENABLED: bool(env.HSTS_ENABLED, true),
    REQUEST_BODY_LIMIT_MB: num(env.REQUEST_BODY_LIMIT_MB, 6),

    JWT: {
      ISSUER: env.JWT_ISSUER ?? 'fnk.network',
      AUDIENCE: env.JWT_AUDIENCE ?? 'fnk.web',
      ACCESS_TTL: num(env.JWT_ACCESS_TTL, 3600),
      REFRESH_TTL: num(env.JWT_REFRESH_TTL, 60*60*24*14),
      SECRET: env.JWT_SECRET ?? 'dev_only_replace_me'
    },

    STORAGE: {
      DRIVER: (env.STORAGE_DRIVER ?? 'local') as 's3'|'local',
      LOCAL_DIR: env.LOCAL_STORAGE_DIR ?? '.uploads',
      S3_BUCKET: env.S3_BUCKET ?? '',
      S3_REGION: env.S3_REGION ?? '',
      S3_ACCESS_KEY_ID: env.S3_ACCESS_KEY_ID ?? '',
      S3_SECRET_ACCESS_KEY: env.S3_SECRET_ACCESS_KEY ?? ''
    },

    EMAIL: {
      DRIVER: (env.EMAIL_DRIVER ?? 'console') as 'smtp'|'console',
      SMTP_HOST: env.SMTP_HOST ?? '',
      SMTP_PORT: num(env.SMTP_PORT, 587),
      SMTP_USER: env.SMTP_USER ?? '',
      SMTP_PASS: env.SMTP_PASS ?? '',
      SMTP_FROM: env.SMTP_FROM ?? 'FindersNotKeepers <no-reply@fnk.app>'
    },

    ADMIN: {
      IP_ALLOWLIST: (env.ADMIN_IP_ALLOWLIST ?? '').split(',').map(s => s.trim()).filter(Boolean)
    }
  } as const;
}

// =============================
// FILE: src/logger.ts
// =============================
import pino from 'pino';
export const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' });

// =============================
// FILE: src/utils/asyncHandler.ts
// =============================
import { RequestHandler } from 'express';
export const ah = (fn: RequestHandler): RequestHandler => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// =============================
// FILE: src/middleware/security.ts
// =============================
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Env } from '../types';

export function createSecurityMiddleware(env: Env) {
  const corsMw = cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow curl/postman
      if (env.ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error('CORS: Origin not allowed'));
    },
    credentials: true
  });

  const helmetMw = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        objectSrc: ["'none'"]
      }
    },
    hsts: env.HSTS_ENABLED ? undefined : false
  });

  const limiter = rateLimit({
    windowMs: 60_000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false
  });

  return { corsMw, helmetMw, limiter };
}

// =============================
// FILE: src/middleware/auth.ts
// =============================
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

// =============================
// FILE: src/services/tokens.ts
// =============================
import jwt from 'jsonwebtoken';
import type { Env } from '../types';

export function createTokenService(env: Env) {
  function signAccess(userId: string) {
    return jwt.sign({ sub: userId, typ: 'access' }, env.JWT.SECRET, {
      expiresIn: env.JWT.ACCESS_TTL,
      audience: env.JWT.AUDIENCE,
      issuer: env.JWT.ISSUER
    });
  }
  function signRefresh(userId: string) {
    return jwt.sign({ sub: userId, typ: 'refresh' }, env.JWT.SECRET, {
      expiresIn: env.JWT.REFRESH_TTL,
      audience: env.JWT.AUDIENCE,
      issuer: env.JWT.ISSUER
    });
  }
  return { signAccess, signRefresh };
}

// =============================
// FILE: src/services/storage/local.ts
// =============================
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

// =============================
// FILE: src/services/storage/s3.ts
// =============================
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

// =============================
// FILE: src/services/email/console.ts
// =============================
import type { EmailDriver } from '../../types';
import { logger } from '../../logger';

export function createConsoleEmailDriver(): EmailDriver {
  return {
    async send(to, subject, html, text) {
      logger.info({ to, subject, html, text }, 'ConsoleEmailDriver:send');
    }
  };
}

// =============================
// FILE: src/services/email/smtp.ts
// =============================
import nodemailer from 'nodemailer';
import type { EmailDriver } from '../../types';

export function createSmtpEmailDriver(opts: { host: string; port: number; user: string; pass: string; from: string; }): EmailDriver {
  const transporter = nodemailer.createTransport({
    host: opts.host,
    port: opts.port,
    secure: opts.port === 465,
    auth: { user: opts.user, pass: opts.pass }
  });
  return {
    async send(to, subject, html, text) {
      await transporter.sendMail({ from: opts.from, to, subject, html, text });
    }
  };
}

// =============================
// FILE: src/repo/memoryUserRepo.ts
// =============================
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { User } from '../types';

const users = new Map<string, User>();

export const memoryUserRepo = {
  async create(email: string, password: string) {
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = { id, email, passwordHash, emailVerified: false, createdAt: new Date().toISOString() };
    users.set(id, user);
    return user;
  },
  async findByEmail(email: string) { return [...users.values()].find(u => u.email === email) ?? null; },
  async verifyEmail(id: string) { const u = users.get(id); if (u) u.emailVerified = true; },
  async validate(email: string, password: string) {
    const u = await this.findByEmail(email);
    if (!u) return null;
    const ok = await bcrypt.compare(password, u.passwordHash);
    return ok ? u : null;
  }
};

// =============================
// FILE: src/routes/public.ts
// =============================
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

// =============================
// FILE: src/routes/auth.ts
// =============================
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

// =============================
// FILE: src/routes/listings.ts
// =============================
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

// =============================
// FILE: src/server.ts
// =============================
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { loadEnv } from './config';
import { logger } from './logger';
import { createSecurityMiddleware } from './middleware/security';
import { publicRoutes } from './routes/public';
import { authRoutes } from './routes/auth';
import { listingRoutes } from './routes/listings';
import { createLocalStorageDriver } from './services/storage/local';
import { createS3StorageDriver } from './services/storage/s3';
import { createConsoleEmailDriver } from './services/email/console';
import { createSmtpEmailDriver } from './services/email/smtp';

const env = loadEnv();
const app = express();

// Body limits aligned with <5MB images + headroom
app.use(express.json({ limit: `${env.REQUEST_BODY_LIMIT_MB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${env.REQUEST_BODY_LIMIT_MB}mb` }));

// Logs & security
app.use(morgan('combined'));
const security = createSecurityMiddleware(env);
app.use(security.helmetMw);
app.use(security.corsMw);
app.use(security.limiter);

// Choose storage driver
const storage = env.STORAGE.DRIVER === 's3'
  ? createS3StorageDriver({
      bucket: env.STORAGE.S3_BUCKET,
      region: env.STORAGE.S3_REGION,
      accessKeyId: env.STORAGE.S3_ACCESS_KEY_ID,
      secretAccessKey: env.STORAGE.S3_SECRET_ACCESS_KEY
    })
  : createLocalStorageDriver(env.STORAGE.LOCAL_DIR);

// Choose email driver
const email = env.EMAIL.DRIVER === 'smtp'
  ? createSmtpEmailDriver({
      host: env.EMAIL.SMTP_HOST,
      port: env.EMAIL.SMTP_PORT,
      user: env.EMAIL.SMTP_USER,
      pass: env.EMAIL.SMTP_PASS,
      from: env.EMAIL.SMTP_FROM
    })
  : createConsoleEmailDriver();

// Routes
app.use('/api/public', publicRoutes(env, storage));
app.use('/api/auth', authRoutes(env, email));
app.use('/api/listings', listingRoutes(env, storage));

// Dev-only: local upload receiver to honor the pseudo-presigned URL created by local storage driver
app.put('/uploads/local/:key', (req, res) => {
  const token = req.query.token;
  const headerToken = req.headers['x-local-upload-token'];
  if (!token || token !== headerToken) return res.status(401).json({ error: 'bad upload token' });
  const key = decodeURIComponent(req.params.key);
  const filePath = path.join(env.STORAGE.LOCAL_DIR, key);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const ws = fs.createWriteStream(filePath);
  req.pipe(ws);
  ws.on('finish', () => res.status(201).json({ key }));
  ws.on('error', () => res.status(500).json({ error: 'write failed' }));
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'UnhandledError');
  res.status(500).json({ error: 'internal_error' });
});

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Networking service started');
});

// =============================
// FILE: README.md (how to run)
// =============================
/**
# FNK Networking Service (standalone / pluggable)

This service exposes a stable, minimal API your UI and other back-ends can consume. It runs standalone for demos and swaps drivers later without changing API.

## Quick start

```bash
cp .env.example .env
npm i
npm run dev
```

### Test flow
1. Health: `GET http://localhost:8080/api/public/health`
2. Register: `POST /api/auth/register` JSON `{ "email": "a@b.com", "password": "pass" }`
3. Login: `POST /api/auth/login` → copy `access`
4. Presign: `POST /api/public/uploads/presign` JSON `{ "contentType": "image/jpeg", "ext": "jpg" }`
   - Returns `{ url, headers, key }`
5. Upload file (local dev): `PUT http://localhost:8080${url}` with header `x-local-upload-token: <headers.token>` and binary body
6. Create listing: `POST /api/listings` with `Authorization: Bearer <access>` body `{ "title": "Red backpack", "imageKey": "<key>" }`
7. Get listing: `GET /api/listings/<id>`

## Swap drivers later
- STORAGE_DRIVER=s3 → implement real presigned URLs and CDN public URL
- EMAIL_DRIVER=smtp → real SMTP provider

## Security & limits
- CORS allows only ALLOWED_ORIGINS
- Helmet + CSP + HSTS
- Rate limiting and body size caps
- JWT access/refresh tokens

*/
