
import type { EmailDriver } from '../../types';
import { logger } from '../../logger';

export function createConsoleEmailDriver(): EmailDriver {
  return {
    async send(to, subject, html, text) {
      logger.info({ to, subject, html, text }, 'ConsoleEmailDriver:send');
    }
  };
}
