"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticateToken = void 0;
const authUtils_1 = require("../utils/authUtils");
const Company_1 = __importDefault(require("../models/Company"));
/**
* Middleware to authenticate JWT token.
* Attaches user information to req.user if token is valid.
*/
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No token provided' });
    }
    const decoded = (0, authUtils_1.verifyToken)(token);
    if (!decoded || typeof decoded === 'string') {
        return res.status(403).json({ message: 'Access Denied: Invalid token' });
    }
    // @ts-expect-error
    req.user = decoded; // Attach decoded payload to request
    next();
};
exports.authenticateToken = authenticateToken;
/**
* Middleware to authorize user roles.
* @param allowedRoles An array of roles that are allowed to access the route.
*/
const authorizeRoles = (allowedRoles) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ message: 'Access Denied: User not authenticated' });
        }
        const { id, role } = req.user;
        if (!allowedRoles.includes(role)) {
            return res.status(403).json({ message: 'Access Denied: Insufficient permissions' });
        }
        // Special check for company approval
        if (role === 'company') {
            const company = await Company_1.default.findById(id);
            if (!company || !company.isApproved || company.status === 'rejected' || company.status === 'disabled' || company.status === 'deleted' || !company.isActive) {
                return res.status(403).json({
                    message: 'Access Denied: Company account is not active or has been rejected/disabled/deleted'
                });
            }
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
