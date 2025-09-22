
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
