import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/authUtils';
import Company from '../models/Company';

/**
* Middleware to authenticate JWT token.
* Attaches user information to req.user if token is valid.
*/
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];

if (!token) {
  return res.status(401).json({ message: 'Access Denied: No token provided' });
}

const decoded = verifyToken(token);

if (!decoded || typeof decoded === 'string') {
  return res.status(403).json({ message: 'Access Denied: Invalid token' });
}
// @ts-expect-error
req.user = decoded; // Attach decoded payload to request
next();
};

/**
* Middleware to authorize user roles.
* @param allowedRoles An array of roles that are allowed to access the route.
*/
export const authorizeRoles = (allowedRoles: string[]) => {
return async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(403).json({ message: 'Access Denied: User not authenticated' });
  }

  const { id, role } = req.user;

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ message: 'Access Denied: Insufficient permissions' });
  }

  // Special check for company approval
  if (role === 'company') {
    const company = await Company.findById(id);
    if (!company || !company.isApproved) {
      return res.status(403).json({ message: 'Access Denied: Company not approved by admin' });
    }
  }

  next();
};
};
