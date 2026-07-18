import crypto from 'node:crypto';

export function hashCccd(cccd: string): string {
  return crypto.createHash('sha256').update(cccd).digest('hex');
}
