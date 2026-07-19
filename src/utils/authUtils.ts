import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
const SALT_ROUNDS = 10;

/**
 * Generates a temporary password for service provider accounts.
 * Mix of letters, numbers, and symbols — suitable to email and change on first login.
 */
export const generateTemporaryPassword = (length = 12): string => {
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
};

/**
* Hashes a plain text password.
* @param password The plain text password.
* @returns The hashed password.
*/
export const hashPassword = async (password: string): Promise<string> => {
return bcrypt.hash(password, SALT_ROUNDS);
};

/**
* Compares a plain text password with a hashed password.
* @param plainPassword The plain text password.
* @param hashedPassword The hashed password.
* @returns True if passwords match, false otherwise.
*/
export const comparePasswords = async (
plainPassword: string,
hashedPassword: string
): Promise<boolean> => {
return bcrypt.compare(plainPassword, hashedPassword);
};

/**
* Generates a JWT token.
* @param payload The payload to include in the token (e.g., user ID, role).
* @returns The generated JWT token.
*/
export const generateToken = (payload: object): string => {
return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' }); // Token expires in 1 hour
};

/**
* Verifies a JWT token.
* @param token The JWT token to verify.
* @returns The decoded payload if valid, null otherwise.
*/
export const verifyToken = (token: string): string | jwt.JwtPayload | null => {
try {
  return jwt.verify(token, JWT_SECRET);
} catch (error) {
  return null;
}
};
