import dotenv from 'dotenv';

dotenv.config();

/**
 * When true, employees with emailVerified !== true cannot log in (403 EMAIL_NOT_VERIFIED).
 * Companies and superadmins are not gated by email verification.
 *
 * Run migrate:email-verified before enabling in production.
 */
export function isAuthV2LoginGateEnabled(): boolean {
  return process.env.AUTH_V2_LOGIN_GATE === 'true';
}
