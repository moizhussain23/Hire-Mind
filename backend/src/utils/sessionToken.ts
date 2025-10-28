import crypto from 'crypto';

/**
 * Generate a unique, secure session token
 * Format: UUID-RandomBytes (highly unique and secure)
 */
export const generateSessionToken = (): string => {
  // Generate UUID v4 using crypto.randomUUID() (Node 14.17+)
  const uuid = crypto.randomUUID();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `${uuid}-${randomBytes}`;
};

/**
 * Hash a token for secure storage (optional extra security layer)
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify if a token matches its hash
 */
export const verifyTokenHash = (token: string, hash: string): boolean => {
  const tokenHash = hashToken(token);
  return tokenHash === hash;
};

/**
 * Generate a short, human-readable session code (for display purposes)
 */
export const generateSessionCode = (): string => {
  // Generate 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
};
