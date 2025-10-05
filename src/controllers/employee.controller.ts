/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import Employee from '../models/Employee';
import Job from '../models/Job';
import Application from '../models/Application';
import { Types } from 'mongoose';
import WorkRequest from '../models/WorkRequest';
import { parseSingleFile, parseMultipleFiles } from '../services/fileUploadService';
import cloudinary from "../config/cloudinary";
import { v2 as cloudinarySdk } from "cloudinary";
import { comparePasswords, hashPassword } from '../utils/authUtils';
import User from '../models/User';
import { sendEmail } from '../utils/sendEmail';


export const getProfile = async (req: Request, res: Response) => {
try {
  const employeeId = req.user?.id;
  if (!employeeId) {
    return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
  }

  const employee = await Employee.findById(employeeId).select('-password'); // Exclude password
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  res.status(200).json({ message: 'Employee profile retrieved successfully', employee });
} catch (error) {
  console.error('Error getting employee profile:', error);
  res.status(500).json({ message: 'Server error' });
}
};

export const updateEmployeeProfile = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
    }

    const updates: any = { ...req.body };
    delete updates.role;
    delete updates.password;
    delete updates.email;

    // Normalize some fields
    if (updates.jobPreferences && !Array.isArray(updates.jobPreferences)) {
      updates.jobPreferences = [updates.jobPreferences];
    }
    if (updates.skills && !Array.isArray(updates.skills)) {
      updates.skills = [updates.skills];
    }
    if (updates.documents && !Array.isArray(updates.documents)) {
      updates.documents = [updates.documents];
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ message: 'Employee profile updated successfully', employee });
  } catch (error) {
    console.error('Error updating employee profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getJobsByCategory = async (req: Request, res: Response) => {
try {
  const { category } = req.query;
  const now = new Date();
  const query: any = {
    isActive: true,
    $or: [
      { applicationDeadlineAt: { $exists: false } },
      { applicationDeadlineAt: { $gt: now } }
    ]
  };

  if (category && typeof category === 'string') {
    query.category = category;
  }

  const jobs = await Job.find(query).populate('companyId', 'companyName logo'); // Populate company name and logo
  res.status(200).json({ message: 'Jobs retrieved successfully', jobs });
} catch (error) {
  console.error('Error getting jobs by category:', error);
  res.status(500).json({ message: 'Server error' });
}
};


export const getJobSuggestions = async (req: Request, res: Response) => {
try {
  const employeeId = req.user?.id;
  const { category } = req.query;
  const now = new Date();
  const query: any = {
    isActive: true,
    $or: [
      { applicationDeadlineAt: { $exists: false } },
      { applicationDeadlineAt: { $gt: now } }
    ]
  };

  if (category && typeof category === 'string') {
    query.category = category;
  }

  // If employee is logged in, use their jobPreferences to suggest jobs
  if (employeeId) {
    const employee = await Employee.findById(employeeId);
    if (employee && employee.jobPreferences && employee.jobPreferences.length > 0) {
      query.$or = [
        { category: { $in: employee.jobPreferences } },
        { title: { $in: employee.jobPreferences.map((p: string) => new RegExp(p, 'i')) } },
      ];
    }
  }

  const jobs = await Job.find(query).populate('companyId', 'companyName logo');
  res.status(200).json({ message: 'Job suggestions retrieved successfully', jobs });
} catch (error) {
  console.error('Error getting job suggestions:', error);
  res.status(500).json({ message: 'Server error' });
}
};


export const applyForJob = async (req: Request, res: Response) => {
try {
  const { jobId } = req.params;
  const { coverLetter, experience, appliedVia, message } = req.body as any;
  const employeeId = req.user?.id;
  const employee = await Employee.findById(employeeId).select("name email skills");

  if (!employeeId) {
    return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
  }

  if (!Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ message: 'Invalid Job ID' });
  }

  const job = await Job.findById(jobId).populate('companyId', 'email companyName');
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  try {
    await sendEmail({
      to: (job.companyId as any).email,
      type: 'jobApplication',
      data: {
        applicantName: employee?.name || '',
        applicantEmail: employee?.email || '',
        jobTitle: job.title,
        jobId: (job._id as any).toString()
      }
    });
  } catch (emailError) {
    console.error('Failed to send job application email', emailError);
  }

  const existingApplication = await Application.findOne({ jobId, employeeId });
  if (existingApplication) {
    return res.status(400).json({ message: 'You have already applied for this job' });
  }

  // Parse uploaded resume file (uploaded via middleware as complete file info object)
  const resumeFile = parseSingleFile((req.body as any).resume);

  const application = await Application.create({
    jobId,
    employeeId,
    skills: [],
    experience,
    coverLetter: typeof coverLetter === 'string' ? coverLetter : (typeof message === 'string' ? message : undefined),
    resume: resumeFile?.url,
    appliedVia: appliedVia || 'normal',
    status: 'pending',
  });

  // Create system notification for the company
  try {
    await Application.findByIdAndUpdate(application._id, {
      $push: {
        notifications: {
          message: `New application received for ${job.title}`,
          read: false,
          createdAt: new Date(),
        }
      }
    });
  } catch (error) {
    console.error('Failed to create system notification for company on job application', error);
  }

  res.status(201).json({ message: 'Application submitted successfully', application });
} catch (error) {
  console.error('Error applying for job:', error);
  res.status(500).json({ message: 'Server error' });
}
};

export const getApplications = async (req: Request, res: Response) => {
try {
  const employeeId = req.user?.id;
  if (!employeeId) {
    return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
  }

  const applications = await Application.find({ employeeId })
    .populate('jobId', 'title companyId') // Populate job title and company ID
    .populate({
      path: 'jobId',
      populate: {
        path: 'companyId',
        select: 'companyName logo', // Select company name and logo from companyId
      },
    });

  res.status(200).json({ message: 'Applications retrieved successfully', applications });
} catch (error) {
  console.error('Error getting applications:', error);
  res.status(500).json({ message: 'Server error' });
}
};

export const getNotifications = async (req: Request, res: Response) => {
try {
  const employeeId = req.user?.id;
  if (!employeeId) {
    return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Find applications and work requests for the employee and return their notifications
  const [applications, workRequests] = await Promise.all([
    Application.find({ employeeId }).select('notifications'),
    WorkRequest.find({ employeeId }).select('notifications')
  ]);

  const applicationNotifications = applications.flatMap((app: any) => app.notifications as any[]);
  const workRequestNotifications = workRequests.flatMap((wr: any) => wr.notifications as any[]);
  const allNotifications = [...applicationNotifications, ...workRequestNotifications];

  // Sort by creation date (newest first)
  allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Apply pagination
  const total = allNotifications.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedNotifications = allNotifications.slice(skip, skip + limit);

  res.status(200).json({ 
    message: 'Notifications retrieved successfully', 
    notifications: paginatedNotifications,
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
  console.error('Error getting notifications:', error);
  res.status(500).json({ message: 'Server error' });
}
};


export const listWorkRequests = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(403).json({ message: 'Access Denied' });
    const requests = await WorkRequest.find({ employeeId }).populate('companyId', 'companyName logo');
    res.status(200).json({ message: 'Work requests retrieved', requests });
  } catch (error) {
    console.error('Error listing work requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const respondWorkRequest = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    const { id } = req.params as { id: string };
    const { action } = req.body as { action: 'accept' | 'reject' };
    if (!employeeId) return res.status(403).json({ message: 'Access Denied' });
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid request id' });
    const wr = await WorkRequest.findById(id);
    if (!wr) return res.status(404).json({ message: 'Work request not found' });
    if (wr.employeeId.toString() !== employeeId) return res.status(403).json({ message: 'Access Denied' });
    wr.status = action === 'accept' ? 'accepted' : 'rejected';
    wr.notifications.push({ message: `Employee has ${wr.status} your request`, read: false, createdAt: new Date() } as any);
    await wr.save();

    // Notify company via email
    try {
      const [company, employee] = await Promise.all([
        (await (await import('../models/Company')).default.findById(wr.companyId).select('companyName email logo')),
        (await (await import('../models/Employee')).default.findById(wr.employeeId).select('name email')),
      ]);

      if (company?.email && employee?.name) {
        await sendEmail({
          type: 'offerResponse',
          to: (company as any).email,
          data: {
            companyDisplayName: (company as any).companyName || 'Your Company',
            employeeName: (employee as any).name,
            jobTitle: 'Work Request',
            action: wr.status === 'accepted' ? 'accepted' : 'rejected',
            viewRequestLink: `${process.env.FRONTEND_URL_DASHBOARD || process.env.APP_URL}/company/work-requests`,
            logo: (company as any)?.logo?.url || process.env.APP_LOGO || '',
          },
        } as any);
      }
    } catch (emailError) {
      console.error('Failed to send offer response email to company', emailError);
    }

    res.status(200).json({ message: 'Response saved', request: wr });
  } catch (error) {
    console.error('Error responding to work request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    const { notificationId } = req.params as { notificationId: string };
    
    if (!employeeId) {
      return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
    }

    if (!Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    // Try update on Application notifications
    const appUpdated = await Application.updateOne(
      { employeeId, 'notifications._id': notificationId },
      { $set: { 'notifications.$.read': true } }
    );
    // Try update on WorkRequest notifications
    const wrUpdated = await WorkRequest.updateOne(
      { employeeId, 'notifications._id': notificationId },
      { $set: { 'notifications.$.read': true } }
    );

    if (appUpdated.modifiedCount === 0 && wrUpdated.modifiedCount === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteEmployeeNotification = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    const { notificationId } = req.params as { notificationId: string };
    
    if (!employeeId) {
      return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
    }

    if (!Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    // Delete from Application notifications
    const appResult = await Application.updateOne(
      { employeeId, 'notifications._id': notificationId },
      { $pull: { notifications: { _id: notificationId } } }
    );
    // Delete from WorkRequest notifications
    const wrResult = await WorkRequest.updateOne(
      { employeeId, 'notifications._id': notificationId },
      { $pull: { notifications: { _id: notificationId } } }
    );

    if (appResult.modifiedCount === 0 && wrResult.modifiedCount === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const uploadEmployeeDocuments = async (req: Request, res: Response) => {
  try {

    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
    }

    const files = parseMultipleFiles((req.body as any).documents);
    
    if (!files.length) {
      return res.status(400).json({ message: 'No documents uploaded' });
    }

    // Store the complete file information objects
    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { $push: { documents: { $each: files } } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ message: 'Documents uploaded successfully', employee });
  } catch (error) {
    console.error('Error uploading employee documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const uploadProfileImage = async (req: Request, res: Response) => {
  try {

    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
    }

    const file = parseSingleFile((req.body as any).image);
    
    if (!file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // Store the complete file information object
    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: { profileImage: file } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ message: 'Profile image uploaded successfully', employee });
  } catch (error) {
    console.error('Error uploading employee profile image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfileImage = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
    }

    const file = parseSingleFile((req.body as any).image);
    
    if (!file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // Store the complete file information object
    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: { profileImage: file } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ message: 'Profile image updated successfully', employee });
  } catch (error) {
    console.error('Error updating employee profile image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteProfileImage = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
    }

    const current = await Employee.findById(employeeId).select('profileImage');
    if (!current) return res.status(404).json({ message: 'Employee not found' });
    const publicId = (current as any)?.profileImage?.public_id as string | undefined;
    if (publicId) {
      try {
        cloudinarySdk.config({
          cloud_name: cloudinary.cloudName,
          api_key: cloudinary.apiKey,
          api_secret: cloudinary.apiSecret,
        });
        await cloudinarySdk.uploader.destroy(publicId);
      } catch (e) {
        // ignore errors
      }
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { $unset: { profileImage: 1 } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ message: 'Profile image deleted successfully', employee });
  } catch (error) {
    console.error('Error deleting employee profile image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateDocuments = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
    }

    const files = parseMultipleFiles((req.body as any).documents);
    
    if (!files.length) {
      return res.status(400).json({ message: 'No documents provided' });
    }

    // Store the complete file information objects
    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: { documents: files } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ message: 'Documents updated successfully', employee });
  } catch (error) {
    console.error('Error updating employee documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    const { index } = req.params;

    if (!employeeId) {
      return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
    }

    const documentIndex = parseInt(index);
    if (isNaN(documentIndex) || documentIndex < 0) {
      return res.status(400).json({ message: 'Invalid document index' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (!employee.documents || documentIndex >= employee.documents.length) {
      return res.status(400).json({ message: 'Document index out of range' });
    }

    const doc: any = (employee.documents as any[])[documentIndex];
    const publicId: string | undefined = doc && typeof doc === 'object' ? doc.public_id : undefined;
    if (publicId) {
      try {
        cloudinarySdk.config({
          cloud_name: cloudinary.cloudName,
          api_key: cloudinary.apiKey,
          api_secret: cloudinary.apiSecret,
        });
        await cloudinarySdk.uploader.destroy(publicId);
      } catch (e) {
        // ignore errors
      }
    }

    employee.documents.splice(documentIndex, 1);
    await employee.save();

    res.status(200).json({ message: 'Document deleted successfully', employee });
  } catch (error) {
    console.error('Error deleting employee document:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    const { oldPassword, newPassword } = req.body;

    if (!employeeId) {
      return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if employee has a password (should always exist for employees)
    if (!employee.password) {
      return res.status(400).json({ message: 'Employee password not found' });
    }

    // Verify old password
    const isMatch = await comparePasswords(oldPassword, employee.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid old password' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: { password: hashedPassword } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ message: 'Password reset successfully', employee: updatedEmployee });
  } catch (error) {
    console.error('Error resetting employee password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deactivateEmployeeAccount = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
    
    // Update both User and Employee models
    const updatedUser = await User.findByIdAndUpdate(
      employeeId,
      { $set: { isActive: false } },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) return res.status(404).json({ message: 'Employee not found' });
    
    res.status(200).json({ message: 'Account deactivated', user: updatedUser });
  } catch (error) {
    console.error('Error deactivating employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const activateEmployeeAccount = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
    
    // Update both User and Employee models
    const updatedUser = await User.findByIdAndUpdate(
      employeeId,
      { $set: { isActive: true } },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) return res.status(404).json({ message: 'Employee not found' });
    
    res.status(200).json({ message: 'Account activated', user: updatedUser });
  } catch (error) {
    console.error('Error activating employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteEmployeeAccount = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
    
    // Soft-delete: set isActive false. For full removal, we'd remove discriminator docs as well.
    const updatedUser = await User.findByIdAndUpdate(
      employeeId,
      { $set: { isActive: false } },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) return res.status(404).json({ message: 'Employee not found' });
    
    res.status(200).json({ message: 'Account deleted', user: updatedUser });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Check if employee has already applied to a specific job
 */
export const checkJobApplication = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    const { jobId } = req.params as { jobId: string };
    
    if (!employeeId) {
      return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
    }
    
    if (!Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: 'Invalid Job ID' });
    }

    const application = await Application.findOne({ 
      employeeId, 
      jobId 
    });

    res.status(200).json({ 
      message: 'Application status checked successfully',
      hasApplied: !!application,
      application: application || null
    });
  } catch (error) {
    console.error('Error checking job application:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
