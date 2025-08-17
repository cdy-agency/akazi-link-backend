/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import Employee from '../models/Employee';
import Job from '../models/Job';
import Application from '../models/Application';
import { Types } from 'mongoose';
import WorkRequest from '../models/WorkRequest';


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
  const query: any = {};

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
  const query: any = {};

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
  const { skills, experience, appliedVia } = req.body;
  const employeeId = req.user?.id;

  if (!employeeId) {
    return res.status(403).json({ message: 'Access Denied: Employee ID not found in token' });
  }

  if (!Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ message: 'Invalid Job ID' });
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  const existingApplication = await Application.findOne({ jobId, employeeId });
  if (existingApplication) {
    return res.status(400).json({ message: 'You have already applied for this job' });
  }

  const application = await Application.create({
    jobId,
    employeeId,
    skills,
    experience,
    
    appliedVia: appliedVia || 'normal',
    status: 'pending',
  });

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

  // Find applications for the employee and return their notifications
  const applications = await Application.find({ employeeId }).select('notifications');

  const allNotifications = applications.flatMap(app => app.notifications);

  // Optionally, mark notifications as read after fetching them
  // await Application.updateMany(
  //   { employeeId, 'notifications.read': false },
  //   { $set: { 'notifications.$[elem].read': true } },
  //   { arrayFilters: [{ 'elem.read': false }] }
  // );

  res.status(200).json({ message: 'Notifications retrieved successfully', notifications: allNotifications });
} catch (error) {
  console.error('Error getting notifications:', error);
  res.status(500).json({ message: 'Server error' });
}
};

/**
 * Employee views and responds to work requests
 */
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

    // Find the application that contains this notification
    const application = await Application.findOne({
      employeeId,
      'notifications._id': notificationId
    });

    if (!application) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Mark the specific notification as read
    await Application.updateOne(
      { 
        employeeId, 
        'notifications._id': notificationId 
      },
      { 
        $set: { 
          'notifications.$.read': true 
        } 
      }
    );

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

    // Find and delete the notification from the application
    const result = await Application.updateOne(
      { 
        employeeId, 
        'notifications._id': notificationId 
      },
      { 
        $pull: { 
          notifications: { _id: notificationId } 
        } 
      }
    );

    if (result.modifiedCount === 0) {
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

    const rawDocs = (req.body as any).documents as any;
    const docsArray = Array.isArray(rawDocs) ? rawDocs : rawDocs ? [rawDocs] : [];
    const urls: string[] = docsArray
      .map((doc: any) => (typeof doc === 'string' ? doc : (doc && typeof doc === 'object' && doc.url ? doc.url : null)))
      .filter((u: string | null): u is string => Boolean(u));

    if (!urls.length) {
      return res.status(400).json({ message: 'No documents uploaded' });
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { $push: { documents: { $each: urls } } },
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
