
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
