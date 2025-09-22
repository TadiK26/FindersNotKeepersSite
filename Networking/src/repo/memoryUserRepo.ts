
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
