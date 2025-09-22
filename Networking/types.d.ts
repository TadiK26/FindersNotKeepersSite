
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
