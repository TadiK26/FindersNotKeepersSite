
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
