
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
