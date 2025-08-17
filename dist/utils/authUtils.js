"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = exports.comparePasswords = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
const SALT_ROUNDS = 10;
/**
* Hashes a plain text password.
* @param password The plain text password.
* @returns The hashed password.
*/
const hashPassword = async (password) => {
    return bcrypt_1.default.hash(password, SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
/**
* Compares a plain text password with a hashed password.
* @param plainPassword The plain text password.
* @param hashedPassword The hashed password.
* @returns True if passwords match, false otherwise.
*/
const comparePasswords = async (plainPassword, hashedPassword) => {
    return bcrypt_1.default.compare(plainPassword, hashedPassword);
};
exports.comparePasswords = comparePasswords;
/**
* Generates a JWT token.
* @param payload The payload to include in the token (e.g., user ID, role).
* @returns The generated JWT token.
*/
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '30d' }); // Token expires in 1 hour
};
exports.generateToken = generateToken;
/**
* Verifies a JWT token.
* @param token The JWT token to verify.
* @returns The decoded payload if valid, null otherwise.
*/
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
