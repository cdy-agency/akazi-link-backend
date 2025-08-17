/// <reference path="../types/express.d.ts" />
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

  const token = generateToken({ id: (adminUser._id as any).toString(), role: adminUser.role });
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
  const {image,email,currentPassword, newPassword } = req.body;

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

  if(newPassword){
    adminUser.password = await hashPassword(newPassword)
  }
  if(image) adminUser.image = image.url
  if(email) adminUser.email = email
  await adminUser.save();

  res.status(200).json({ message: 'Password updated successfully' });
} catch (error) {
  console.error('Error updating admin password:', error);
  res.status(500).json({ message: 'Server error' });
}
};


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

export const approveCompany = async (req: Request, res: Response) => {
try {
  const { id } = req.params;
  
  console.log('Approving company with ID:', id);
  console.log('ID type:', typeof id);
  console.log('ID length:', id?.length);

  if (!Types.ObjectId.isValid(id)) {
    console.log('Invalid ObjectId:', id);
    return res.status(400).json({ message: 'Invalid Company ID' });
  }

  console.log('ObjectId is valid, searching for company...');
  
  const company = await Company.findByIdAndUpdate(
    id, 
    { 
      isApproved: true, 
      status: 'approved',
      isActive: true,
      profileCompletionStatus: 'complete',
      profileCompletedAt: new Date()
    }, 
    { new: true }
  ).select('-password');
  
  console.log('Company found:', company);
  
  if (!company) {
    console.log('Company not found in database');
    return res.status(404).json({ message: 'Company not found' });
  }

  res.status(200).json({ message: 'Company approved successfully', company });
} catch (error) {
  console.error('Error approving company:', error);
  res.status(500).json({ message: 'Server error' });
}
};

/**
 * @swagger
 * /api/admin/company/{id}/reject:
 *   patch:
 *     summary: Reject a company
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
 *         description: ID of the company to reject
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 description: Reason for rejection
 *                 example: "Incomplete documentation provided"
 *     responses:
 *       200:
 *         description: Company rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company rejected successfully
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *       400:
 *         description: Invalid Company ID or missing rejection reason
 *       403:
 *         description: Access Denied
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
export const rejectCompany = async (req: Request, res: Response) => {
try {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Company ID' });
  }

  if (!rejectionReason) {
    return res.status(400).json({ message: 'Rejection reason is required' });
  }

  const company = await Company.findByIdAndUpdate(
    id, 
    { 
      isApproved: false, 
      status: 'rejected',
      isActive: false,
      rejectionReason,
      rejectedAt: new Date(),
      profileCompletionStatus: 'incomplete'
    }, 
    { new: true }
  ).select('-password');
  
  if (!company) {
    return res.status(404).json({ message: 'Company not found' });
  }

  res.status(200).json({ message: 'Company rejected successfully', company });
} catch (error) {
  console.error('Error rejecting company:', error);
  res.status(500).json({ message: 'Server error' });
}
};

/**
 * @swagger
 * /api/admin/company/{id}/disable:
 *   patch:
 *     summary: Disable a company account
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
 *         description: ID of the company to disable
 *     responses:
 *       200:
 *         description: Company disabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company disabled successfully
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
export const disableCompany = async (req: Request, res: Response) => {
try {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Company ID' });
  }

  const company = await Company.findByIdAndUpdate(
    id, 
    { 
      isActive: false, 
      status: 'disabled',
      disabledAt: new Date()
    }, 
    { new: true }
  ).select('-password');
  
  if (!company) {
    return res.status(404).json({ message: 'Company not found' });
  }

  res.status(200).json({ message: 'Company disabled successfully', company });
} catch (error) {
  console.error('Error disabling company:', error);
  res.status(500).json({ message: 'Server error' });
}
};

/**
 * @swagger
 * /api/admin/company/{id}/enable:
 *   patch:
 *     summary: Re-enable a disabled company account
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
 *         description: ID of the company to enable
 *     responses:
 *       200:
 *         description: Company enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company enabled successfully
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
export const enableCompany = async (req: Request, res: Response) => {
try {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Company ID' });
  }

  const company = await Company.findById(id); // Fetch the company to get its current status
  if (!company) {
    return res.status(404).json({ message: 'Company not found' });
  }

  const updatedCompany = await Company.findByIdAndUpdate(
    id, 
    { 
      isActive: true, 
      status: company.isApproved ? 'approved' : 'pending',
      disabledAt: undefined,
      ...(company.isApproved ? { profileCompletionStatus: 'complete' } : {})
    }, 
    { new: true }
  ).select('-password');
  
  if (!updatedCompany) {
    return res.status(404).json({ message: 'Company not found' });
  }

  res.status(200).json({ message: 'Company enabled successfully', updatedCompany });
} catch (error) {
  console.error('Error enabling company:', error);
  res.status(500).json({ message: 'Server error' });
}
};

/**
 * @swagger
 * /api/admin/company/{id}/delete:
 *   delete:
 *     summary: Permanently delete a company
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
 *         description: ID of the company to delete
 *     responses:
 *       200:
 *         description: Company deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company deleted successfully
 *       400:
 *         description: Invalid Company ID
 *       403:
 *         description: Access Denied
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
export const deleteCompany = async (req: Request, res: Response) => {
try {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Company ID' });
  }

  const company = await Company.findByIdAndUpdate(
    id, 
    { 
      status: 'deleted',
      isActive: false,
      deletedAt: new Date()
    }, 
    { new: true }
  ).select('-password');
  
  if (!company) {
    return res.status(404).json({ message: 'Company not found' });
  }

  res.status(200).json({ message: 'Company deleted successfully' });
} catch (error) {
  console.error('Error deleting company:', error);
  res.status(500).json({ message: 'Server error' });
}
};

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all registered users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Access Denied
 *       500:
 *         description: Server error
 */
export const listAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ message: 'Users retrieved successfully', users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @swagger
 * /api/admin/me:
 *   get:
 *     summary: Get logged-in SuperAdmin details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged-in admin details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin details retrieved successfully
 *                 admin:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Access Denied
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
export const getLoggedInAdmin = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(403).json({ message: 'Access Denied: No admin ID found in token' });
    }

    const admin = await User.findById(adminId).select('-password');
    if (!admin || admin.role !== 'superadmin') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({ message: 'Admin details retrieved successfully', admin });
  } catch (error) {
    console.error('Error getting logged-in admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all companies for admin review
 */
export const getCompaniesPendingReview = async (req: Request, res: Response) => {
  try {
    const companies = await Company.find({ profileCompletionStatus: 'pending_review', status: { $in: ['pending'] } }).select('-password').sort({ createdAt: -1 });
    
    res.status(200).json({ 
      message: 'Companies pending review retrieved successfully', 
      companies 
    });
  } catch (error) {
    console.error('Error getting companies:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @swagger
 * /api/admin/company/{id}:
 *   get:
 *     summary: Get full company details for review
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
 *         description: ID of the company to review
 *     responses:
 *       200:
 *         description: Company details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company details retrieved successfully
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
export const getCompanyDetailsForReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Company ID' });
    }

    const company = await Company.findById(id).select('-password');
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Optionally ensure it's in pending_review stage
    // If you want to strictly restrict to pending review, uncomment below:
    // if (company.profileCompletionStatus !== 'pending_review') {
    //   return res.status(400).json({ message: 'Company is not in pending review state' });
    // }

    res.status(200).json({ message: 'Company details retrieved successfully', company });
  } catch (error) {
    console.error('Error retrieving company details for review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Approve a company's completed profile
 */
export const approveCompanyProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Company ID' });
    }

    const company = await Company.findByIdAndUpdate(
      id, 
      { 
        isApproved: true, 
        status: 'approved',
        isActive: true,
        profileCompletionStatus: 'complete'
      }, 
      { new: true }
    ).select('-password');
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json({ message: 'Company profile approved successfully', company });
  } catch (error) {
    console.error('Error approving company profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all employees for admin management
 */
export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find({}).select('-password').sort({ createdAt: -1 });
    
    res.status(200).json({ 
      message: 'All employees retrieved successfully', 
      employees 
    });
  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Reject a company's completed profile
 */
export const rejectCompanyProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Company ID' });
    }

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const company = await Company.findByIdAndUpdate(
      id, 
      { 
        isApproved: false, 
        status: 'rejected',
        isActive: false,
        rejectionReason,
        profileCompletionStatus: 'incomplete',
        rejectedAt: new Date()
      }, 
      { new: true }
    ).select('-password');
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json({ message: 'Company profile rejected successfully', company });
  } catch (error) {
    console.error('Error rejecting company profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get admin notifications
 */
export const getAdminNotifications = async (req: Request, res: Response) => {
  try {
    // For admin, we can aggregate notifications from various sources
    // For now, let's create some system notifications
    const notifications = [
      {
        _id: '1',
        message: 'New company registration pending review',
        read: false,
        createdAt: new Date(),
        type: 'system'
      },
      {
        _id: '2', 
        message: 'New employee registered',
        read: false,
        createdAt: new Date(),
        type: 'system'
      }
    ];

    res.status(200).json({ 
      message: 'Admin notifications retrieved successfully', 
      notifications 
    });
  } catch (error) {
    console.error('Error getting admin notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Mark admin notification as read
 */
export const markAdminNotificationRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    // In a real implementation, you would update the notification in the database
    // For now, we'll just return success
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking admin notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete admin notification
 */
export const deleteAdminNotification = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    // In a real implementation, you would delete the notification from the database
    // For now, we'll just return success
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
