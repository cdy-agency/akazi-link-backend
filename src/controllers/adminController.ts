import { Request, Response } from 'express';
import User from '../models/User';
import Company from '../models/Company';
import Employee from '../models/Employee';
import { comparePasswords, generateToken, hashPassword } from '../utils/authUtils';
import { Types } from 'mongoose';

/**
* @swagger
* tags:
*   name: Admin
*   description: SuperAdmin specific operations
*/

/**
* @swagger
* /api/admin/login:
*   post:
*     summary: Log in as SuperAdmin
*     tags: [Admin]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - email
*               - password
*             properties:
*               email:
*                 type: string
*                 format: email
*                 example: admin@joblink.com
*               password:
*                 type: string
*                 format: password
*                 example: admin123
*     responses:
*       200:
*         description: Admin login successful
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Admin login successful
*                 token:
*                   type: string
*                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
*                 role:
*                   type: string
*                   example: superadmin
*       400:
*         description: Invalid credentials
*       500:
*         description: Server error
*/
export const adminLogin = async (req: Request, res: Response) => {
try {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  const adminUser = await User.findOne({ email, role: 'superadmin' });
  if (!adminUser) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const isMatch = await comparePasswords(password, adminUser.password!);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = generateToken({ id: adminUser._id, role: adminUser.role });
  res.status(200).json({ message: 'Admin login successful', token, role: adminUser.role });
} catch (error) {
  console.error('Error during admin login:', error);
  res.status(500).json({ message: 'Server error' });
}
};

/**
* @swagger
* /api/admin/update-password:
*   patch:
*     summary: Update SuperAdmin password
*     tags: [Admin]
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - currentPassword
*               - newPassword
*             properties:
*               currentPassword:
*                 type: string
*                 format: password
*                 example: admin123
*               newPassword:
*                 type: string
*                 format: password
*                 example: newAdminPass456
*     responses:
*       200:
*         description: Password updated successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Password updated successfully
*       400:
*         description: Invalid current password or missing fields
*       403:
*         description: Access Denied
*       404:
*         description: Admin user not found
*       500:
*         description: Server error
*/
export const updateAdminPassword = async (req: Request, res: Response) => {
try {
  const adminId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!adminId) {
    return res.status(403).json({ message: 'Access Denied: Admin ID not found in token' });
  }
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide current and new passwords' });
  }

  const adminUser = await User.findById(adminId);
  if (!adminUser || adminUser.role !== 'superadmin') {
    return res.status(404).json({ message: 'Admin user not found' });
  }

  const isMatch = await comparePasswords(currentPassword, adminUser.password!);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid current password' });
  }

  adminUser.password = await hashPassword(newPassword);
  await adminUser.save();

  res.status(200).json({ message: 'Password updated successfully' });
} catch (error) {
  console.error('Error updating admin password:', error);
  res.status(500).json({ message: 'Server error' });
}
};

/**
* @swagger
* /api/admin/employees:
*   get:
*     summary: Get all registered employees
*     tags: [Admin]
*     security:
*       - bearerAuth: []
*     responses:
*       200:
*         description: Employees retrieved successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Employees retrieved successfully
*                 employees:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/Employee'
*       403:
*         description: Access Denied
*       500:
*         description: Server error
*/
export const getEmployees = async (req: Request, res: Response) => {
try {
  const employees = await Employee.find().select('-password'); // Exclude passwords
  res.status(200).json({ message: 'Employees retrieved successfully', employees });
} catch (error) {
  console.error('Error getting employees:', error);
  res.status(500).json({ message: 'Server error' });
}
};

/**
* @swagger
* /api/admin/companies:
*   get:
*     summary: Get all registered companies
*     tags: [Admin]
*     security:
*       - bearerAuth: []
*     responses:
*       200:
*         description: Companies retrieved successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Companies retrieved successfully
*                 companies:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/Company'
*       403:
*         description: Access Denied
*       500:
*         description: Server error
*/
export const getCompanies = async (req: Request, res: Response) => {
try {
  const companies = await Company.find().select('-password'); // Exclude passwords
  res.status(200).json({ message: 'Companies retrieved successfully', companies });
} catch (error) {
  console.error('Error getting companies:', error);
  res.status(500).json({ message: 'Server error' });
}
};

/**
* @swagger
* /api/admin/company/{id}/approve:
*   patch:
*     summary: Approve a company
*     tags: [Admin]
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: string
*           format: mongo-id
*         description: ID of the company to approve
*     responses:
*       200:
*         description: Company approved successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Company approved successfully
*                 company:
*                   $ref: '#/components/schemas/Company'
*       400:
*         description: Invalid Company ID
*       403:
*         description: Access Denied
*       404:
*         description: Company not found
*       500:
*         description: Server error
*/
export const approveCompany = async (req: Request, res: Response) => {
try {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Company ID' });
  }

  const company = await Company.findByIdAndUpdate(id, { isApproved: true }, { new: true }).select('-password');
  if (!company) {
    return res.status(404).json({ message: 'Company not found' });
  }

  res.status(200).json({ message: 'Company approved successfully', company });
} catch (error) {
  console.error('Error approving company:', error);
  res.status(500).json({ message: 'Server error' });
}
};
