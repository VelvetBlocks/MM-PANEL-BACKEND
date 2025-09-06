import * as crypto from 'crypto';

export function getClientIp(req: any): string {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.connection.remoteAddress
  );
}

export function generateStrongPassword(length = 12): Promise<string> {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~';

  const password = Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((x) => charset[x % charset.length])
    .join('');

  return Promise.resolve(password);
}
