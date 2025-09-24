/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import User from '../models/User';
import Company from '../models/Company';
import Employee from '../models/Employee';
import { comparePasswords, generateToken, hashPassword } from '../utils/authUtils';
import { Types } from 'mongoose';
import { sendEmail } from '../utils/sendEmail';
import AdminNotification from '../models/AdminNotification';

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
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [employees, total] = await Promise.all([
    Employee.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Employee.countDocuments()
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({ 
    message: 'Employees retrieved successfully', 
    employees,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
} catch (error) {
  console.error('Error getting employees:', error);
  res.status(500).json({ message: 'Server error' });
}
};

export const getCompanies = async (req: Request, res: Response) => {
try {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [companies, total] = await Promise.all([
    Company.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Company.countDocuments()
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({ 
    message: 'Companies retrieved successfully', 
    companies,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
} catch (error) {
  res.status(500).json({ message: 'Server error' });
}
};

export const approveCompany = async (req: Request, res: Response) => {
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
      profileCompletionStatus: 'complete',
      profileCompletedAt: new Date()
    }, 
    { new: true }
  ).select('-password');
  
  
  if (!company) {
    return res.status(404).json({ message: 'Company not found' });
  }

  
  await sendEmail({
  to: company.email,
  type: "companyApproval",
  data: {
    companyName: company.companyName,
    status: "approved",
    message: "Congratulations! Your company has been approved.",
    dashboardLink: `${process.env.FRONTEND_URL_DASHBOARD}/company`,
    logo: company.logo?.url || process.env.APP_LOGO,
  },
});

  // Company system notification
  try {
    await Company.findByIdAndUpdate(id, {
      $push: { notifications: { message: 'Your company has been approved', read: false, createdAt: new Date() } }
    });
  } catch (error) {
    console.error('Failed to create company system notification (approved)', error);
  }
  // Admin system notification
  try {
    await AdminNotification.create({
      message: `Company approved: ${company.companyName}`,
      read: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to create admin notification for approveCompany', error);
  }

  res.status(200).json({ message: 'Company approved successfully', company });
} catch (error) {
  console.error('Error approving company:', error);
  res.status(500).json({ message: 'Server error' });
}
};

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

  await sendEmail({
    to: company.email,
    type:'companyApproval',
    data:{
      companyName: company.companyName,
      status: 'rejected',
      message: rejectionReason,
      logo: process.env.APP_LOGO,
    }
  })

  // Company system notification
  try {
    await Company.findByIdAndUpdate(id, {
      $push: { notifications: { message: 'Your company application was rejected', read: false, createdAt: new Date() } }
    });
  } catch (error) {
    console.error('Failed to create company system notification (rejected)', error);
  }
  // Admin system notification
  try {
    await AdminNotification.create({
      message: `Company rejected: ${company.companyName}`,
      read: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to create admin notification for rejectCompany', error);
  }

  res.status(200).json({ message: 'Company rejected successfully', company });
} catch (error) {
  console.error('Error rejecting company:', error);
  res.status(500).json({ message: 'Server error' });
}
};

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

export const listAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ message: 'Users retrieved successfully', users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


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


//  Approve a company's completed profile

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

    // Notify company via email and system notification
    try {
      await sendEmail({
        to: company.email,
        type: 'companyApproval',
        data: {
          companyName: company.companyName,
          status: 'approved',
          message: 'Your profile has been approved. Welcome!',
          dashboardLink: `${process.env.FRONTEND_URL_DASHBOARD}/company`,
          logo: process.env.APP_LOGO,
        },
      });
    } catch (e) {
      console.error('Failed sending company approval email (approveCompanyProfile)', e);
    }
    try {
      await Company.findByIdAndUpdate(id, {
        $push: { notifications: { message: 'Your profile has been approved', read: false, createdAt: new Date() } }
      });
    } catch (e) {
      console.error('Failed creating company system notification (approveCompanyProfile)', e);
    }

    res.status(200).json({ message: 'Company profile approved successfully', company });
  } catch (error) {
    console.error('Error approving company profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


//  Get all employees for admin management

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


//  Reject a company's completed profile

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

    // Notify company via email and system notification
    try {
      await sendEmail({
        to: company.email,
        type: 'companyApproval',
        data: {
          companyName: company.companyName,
          status: 'rejected',
          message: rejectionReason,
          logo: process.env.APP_LOGO,
        },
      });
    } catch (e) {
      console.error('Failed sending company rejection email (rejectCompanyProfile)', e);
    }
    try {
      await Company.findByIdAndUpdate(id, {
        $push: { notifications: { message: 'Your profile was rejected', read: false, createdAt: new Date() } }
      });
    } catch (e) {
      console.error('Failed creating company system notification (rejectCompanyProfile)', e);
    }

    res.status(200).json({ message: 'Company profile rejected successfully', company });
  } catch (error) {
    console.error('Error rejecting company profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


//  Get admin notifications

export const getAdminNotifications = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      AdminNotification.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      AdminNotification.countDocuments()
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({ 
      message: 'Admin notifications retrieved successfully', 
      notifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
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
    await AdminNotification.findByIdAndUpdate(notificationId, { $set: { read: true } });
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
    await AdminNotification.findByIdAndDelete(notificationId);
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
