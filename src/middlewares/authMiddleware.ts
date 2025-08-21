import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/authUtils';
import Company from '../models/Company';
import Employee from '../models/Employee';

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
    if (!company || !company.isApproved || company.status === 'rejected' || company.status === 'disabled' || company.status === 'deleted' || !company.isActive) {
      return res.status(403).json({ 
        message: 'Access Denied: Company account is not active or has been rejected/disabled/deleted' 
      });
    }
  }

  next();
};
};

/**
 * authorizeCompany with optional approval requirement.
 * - When requireApproval is true (default), behaves like authorizeRoles(['company']).
 * - When requireApproval is false, allows pending/rejected companies to access,
 *   but still blocks disabled/deleted and inactive accounts.
 */
export const authorizeCompany = (options?: { requireApproval?: boolean }) => {
  const { requireApproval = true } = options || {};
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Access Denied: User not authenticated' });
    }
    const { id, role } = req.user;
    if (role !== 'company') {
      return res.status(403).json({ message: 'Access Denied: Insufficient permissions' });
    }
    const company = await Company.findById(id);
    if (!company) {
      return res.status(403).json({ message: 'Access Denied: Company not found' });
    }
    // Always block disabled or deleted
    if (company.status === 'disabled' || company.status === 'deleted' || !company.isActive) {
      return res.status(403).json({ message: 'Access Denied: Company account is disabled or deleted' });
    }
    if (requireApproval) {
      if (!company.isApproved || company.status === 'rejected') {
        return res.status(403).json({ message: 'Access Denied: Company not approved' });
      }
    }
    next();
  };
};

// Ensure employee is active for write operations
export const ensureEmployeeActive = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(403).json({ message: 'Access Denied: User not authenticated' });
      }
      if (req.user.role !== 'employee') return next();
      const employee = await Employee.findById(req.user.id);
      if (!employee) {
        return res.status(403).json({ message: 'Access Denied: Employee not found' });
      }
      if ((employee as any).isActive === false) {
        return res.status(403).json({ message: 'Access Denied: Account is deactivated' });
      }
      next();
    } catch (e) {
      return res.status(500).json({ message: 'Server error' });
    }
  }
}