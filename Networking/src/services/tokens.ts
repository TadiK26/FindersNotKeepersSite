
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
