/// <reference path="../types/express.d.ts" />
import { Request, Response } from "express";
import Company from "../models/Company";
import Job from "../models/Job";
import { Types } from "mongoose";
import WorkRequest from "../models/WorkRequest";
import { comparePasswords, hashPassword } from "../utils/authUtils";
import { IFileInfo } from "../types/models";
import { parseSingleFile, parseMultipleFiles, updateSingleFileField, pushMultipleFiles, replaceMultipleFiles } from '../services/fileUploadService';
import cloudinary from "../config/cloudinary";
import { v2 as cloudinarySdk } from "cloudinary";
import { parseSingleFile as parseSingleFileUpload } from '../services/fileUploadService';
import { sendEmail } from "../utils/sendEmail";
import AdminNotification from "../models/AdminNotification";
import Employee from "../models/Employee";
import Application from "../models/Application";


export const getProfile = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: Company ID not found in token" });
    }

    const company = await Company.findById(companyId).select("-password"); // Exclude password
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Provide a status notice for frontend popup/banner
    let statusNotice: string | undefined;
    if (
      company.status === "approved" &&
      company.profileCompletionStatus === "complete"
    ) {
      statusNotice = "Your company is approved. You can now post jobs.";
    } else if (
      company.profileCompletionStatus === "complete" &&
      company.status === "pending"
    ) {
      statusNotice =
        "Congratulations! You have completed your profile. Please wait for admin approval.";
    } else if (company.profileCompletionStatus === "pending_review") {
      statusNotice =
        "Your profile has been submitted and is pending admin review.";
    } else if (company.profileCompletionStatus === "incomplete") {
      statusNotice =
        "Complete your profile to unlock job posting and other features.";
    }

    res
      .status(200)
      .json({
        message: "Company profile retrieved successfully",
        company,
        statusNotice,
      });
  } catch (error) {
    console.error("Error getting company profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateProfile = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: Company ID not found in token" });
    }

    const { oldPassword, newPassword, logo, documents, teamMembers, ...updates } = req.body;

    delete updates.email;
    delete updates.role;
    delete updates.isApproved;
    delete (updates as any).logo;
    delete (updates as any).documents;

    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ message: "Old password is required" });
      }
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const isMatch = await comparePasswords(oldPassword, company.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid old password" });
      }
      updates.password = await hashPassword(newPassword);
    }

    // If teamMembers provided, set it
    if (teamMembers && Array.isArray(teamMembers)) {
      updates.teamMembers = teamMembers;
    }

    const company = await Company.findByIdAndUpdate(
      companyId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    await recomputeProfileCompletionStatus(companyId);
    const refreshed = await Company.findById(companyId).select("-password");

    res.status(200).json({
      message: "Company profile updated successfully",
      company: refreshed,
    });
  } catch (error) {
    console.error("Error updating company profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Next-step completion endpoint for companies to provide missing details
 * Expects: about (string), logo (IFileInfo), documents (IFileInfo[])
 */
export const completeCompanyProfile = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: Company ID not found in token" });
    }

    const bodyAny = req.body as any;
    const about = typeof bodyAny.about === "string" ? bodyAny.about : undefined;
    const logo = parseSingleFile(bodyAny.logo);
    const documents = parseMultipleFiles(bodyAny.documents);

    const set: any = {};
    if (typeof about === "string") set.about = about;
    if (logo) set.logo = logo;
    if (documents && documents.length) set.documents = documents;

    // Do NOT mark as complete here. Mark as pending_review if criteria met.
    // Admin approval will mark it as complete later.

    const company = await Company.findByIdAndUpdate(
      companyId,
      { $set: set },
      { new: true, runValidators: true }
    ).select("-password");

    if (!company) return res.status(404).json({ message: "Company not found" });

    const prevStatus = company.profileCompletionStatus;
    const nextStatus = await recomputeProfileCompletionStatus(companyId);
    const refreshed = await Company.findById(companyId).select("-password");

    // If transitioned to pending_review, notify admin via email and system
    if (prevStatus !== "pending_review" && nextStatus === "pending_review") {
      try {
        await sendEmail({
          type: "companyProfileCompletedNotify",
          to: process.env.SMTP_USER || "",
          data: {
            companyName: refreshed?.companyName || company.companyName,
            dashboardLink: `${process.env.FRONTEND_URL_DASHBOARD}/admin`,
            logo: refreshed?.logo?.url || company.logo?.url,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send admin email for profile completion", emailErr);
      }
      try {
        await AdminNotification.create({
          message: `Company profile completed: ${refreshed?.companyName || company.companyName}`,
          read: false,
          createdAt: new Date(),
        });
      } catch (notifErr) {
        console.error("Failed to create admin system notification for profile completion", notifErr);
      }
    }

    res
      .status(200)
      .json({
        message: "Company profile submitted for review",
        company: refreshed,
      });
  } catch (error) {
    console.error("Error completing company profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const postJob = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: Company ID not found in token" });
    }

    const {
      title,
      description,
      image,
      skills,
      experience,
      province,
      district, 
      salary,
      employmentType,
      responsibilities,
      applicationDeadline,
      category,
      benefits,
      otherBenefits,
    } = req.body;

    if (!title || !description || !employmentType || !category) {
      return res
        .status(400)
        .json({
          message:
            "Please provide title, description, employment type, and category",
        });
    }

    // Compute deadline date if provided
    const applicationDeadlineAt = applicationDeadline
      ? new Date(applicationDeadline)
      : undefined;

    const job = await Job.create({
      title,
      description,
      province,
      district,
      skills,
      ...(image && typeof image === "object" ? { image } : {}),
      experience,
      employmentType,
      salary,
      category,
      benefits: Array.isArray(benefits) ? benefits : [],
      otherBenefits: Array.isArray(otherBenefits) ? otherBenefits : [],
      responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
      applicationDeadline,
      ...(applicationDeadlineAt ? { applicationDeadlineAt } : {}),
      companyId,
    });

    // Find matched employees by jobPreferences
    const matchedEmployees = await (await import("../models/Employee")).default.find({
      jobPreferences: { $in: [category] }
    }).select("-password -role");

    res.status(201).json({ message: "Job posted successfully", job, matchedEmployees });
  } catch (error) {
    console.error("Error posting job:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Supports image replacement via rod-fileupload and coerces array fields.
export const updateJob = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    const { id } = req.params as { id: string };
    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: Company ID not found in token" });
    }
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Job ID" });
    }

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.companyId.toString() !== companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: You do not own this job" });
    }

    const bodyAny = req.body as any;
    const set: any = {};

    const maybeArray = (value: unknown): string[] | undefined => {
      if (typeof value === 'undefined') return undefined;
      if (Array.isArray(value)) return value.filter(v => typeof v === 'string');
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        return [trimmed];
      }
      return [];
    };

    const fields = [
      'title',
      'description',
      'district',
      'province',
      'experience',
      'employmentType',
      'salary',
      'category',
      'applicationDeadline',
    ] as const;

    for (const f of fields) {
      if (typeof bodyAny[f] !== 'undefined') set[f] = bodyAny[f];
    }

    const skills = maybeArray(bodyAny.skills);
    if (typeof skills !== 'undefined') set.skills = skills;
    const responsibilities = maybeArray(bodyAny.responsibilities);
    if (typeof responsibilities !== 'undefined') set.responsibilities = responsibilities;
    const benefits = maybeArray(bodyAny.benefits);
    if (typeof benefits !== 'undefined') set.benefits = benefits;
    const otherBenefits = maybeArray(bodyAny.otherBenefits);
    if (typeof otherBenefits !== 'undefined') set.otherBenefits = otherBenefits;

    // Image (if provided by rod-fileupload, it'll be an object with url)
    // Allow explicit image removal when bodyAny.image === null or 'delete'
    if (bodyAny.image === null || bodyAny.image === 'delete') {
      set.image = undefined;
      (set as any).$unset = { image: 1 };
    } else {
      const image = parseSingleFileUpload(bodyAny.image);
      if (image) set.image = image;
    }

    // Handle deadline update
    if (typeof bodyAny.applicationDeadline !== 'undefined') {
      const deadlineStr = bodyAny.applicationDeadline;
      set.applicationDeadline = deadlineStr;
      const dt = deadlineStr ? new Date(deadlineStr) : undefined;
      if (dt && !isNaN(dt.getTime())) {
        set.applicationDeadlineAt = dt;
      } else {
        (set as any).$unset = { ...(set as any).$unset, applicationDeadlineAt: 1 };
      }
    }

    // Merge $set and optional $unset
    const updateOps: any = { $set: set };
    if ((set as any).$unset) {
      updateOps.$unset = (set as any).$unset;
      delete (set as any).$unset;
    }

    const updated = await Job.findByIdAndUpdate(
      id,
      updateOps,
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Job updated successfully', job: updated });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a single job owned by the authenticated company
 */
export const getCompanyJobById = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    const { id } = req.params as { id: string };
    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: Company ID not found in token" });
    }
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Job ID" });
    }

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.companyId.toString() !== companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: You do not own this job" });
    }

    res.status(200).json({ message: 'Job retrieved successfully', job });
  } catch (error) {
    console.error('Error getting company job by id:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/** Activate/deactivate/delete company account */
export const deactivateCompanyAccount = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) return res.status(403).json({ message: 'Access Denied' });
    const company = await Company.findByIdAndUpdate(
      companyId,
      { $set: { isActive: false, status: 'disabled', disabledAt: new Date() } },
      { new: true, runValidators: true }
    ).select('-password');
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.status(200).json({ message: 'Company deactivated', company });
  } catch (e) {
    console.error('Error deactivating company:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const activateCompanyAccount = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) return res.status(403).json({ message: 'Access Denied' });
    const company = await Company.findById(companyId).select('-password');
    if (!company) return res.status(404).json({ message: 'Company not found' });
    const nextStatus = company.isApproved ? 'approved' : (company.status === 'rejected' ? 'rejected' : 'pending');
    const updated = await Company.findByIdAndUpdate(
      companyId,
      { $set: { isActive: true, status: nextStatus }, $unset: { disabledAt: 1 } },
      { new: true, runValidators: true }
    ).select('-password');
    res.status(200).json({ message: 'Company activated', company: updated });
  } catch (e) {
    console.error('Error activating company:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCompanyAccount = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) return res.status(403).json({ message: 'Access Denied' });
    const updated = await Company.findByIdAndUpdate(
      companyId,
      { $set: { status: 'deleted', isActive: false, deletedAt: new Date() } },
      { new: true, runValidators: true }
    ).select('-password');
    if (!updated) return res.status(404).json({ message: 'Company not found' });
    res.status(200).json({ message: 'Company account deleted', company: updated });
  } catch (e) {
    console.error('Error deleting company:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a job posted by the company
 */
export const deleteJob = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    const { id } = req.params as { id: string };
    
    if (!companyId) {
      return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
    }
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Job ID' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Ensure the job belongs to the requesting company
    if (job.companyId.toString() !== companyId) {
      return res.status(403).json({ message: 'Access Denied: You do not own this job' });
    }

    // Delete the job
    await Job.findByIdAndDelete(id);
    
    // Also delete all applications for this job
    await Application.deleteMany({ jobId: id });

    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getCompanyJobs = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: Company ID not found in token" });
    }

    const jobs = await Job.find({ companyId });
    // Optionally: mark expired ones as inactive on the fly (do not persist automatically)
    res.status(200).json({ message: "Jobs retrieved successfully", jobs });
  } catch (error) {
    console.error("Error getting company jobs:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getApplicantsForJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const companyId = req.user?.id;

    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: Company ID not found in token" });
    }

    if (!Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid Job ID" });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Ensure the job belongs to the requesting company
    if (job.companyId.toString() !== companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: You do not own this job" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [applicants, total] = await Promise.all([
      Application.find({ jobId })
        .populate("employeeId", "name email phoneNumber location about profileImage documents")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Application.countDocuments({ jobId })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({ 
      message: "Applicants retrieved successfully", 
      applicants,
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
    console.error("Error getting applicants for job:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update an application's status (reviewed/interview/hired/rejected) and notify the applicant
 */
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params as { applicationId: string };
    const { status, message } = req.body as {
      status: "pending" | "hired" | "rejected";
      message?: string;
    };
    const companyId = req.user?.id;

    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: Company ID not found in token" });
    }
    if (!Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid Application ID" });
    }
    if (
      !status ||
      !["pending", "hired", "rejected"].includes(
        status
      )
    ) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    // Require a custom message from the company to be delivered with the status update
    const customMessage = typeof message === 'string' && message.trim().length > 0 ? message.trim() : undefined;
    if (!customMessage) {
      return res.status(400).json({ message: "A custom message is required" });
    }

    const application = await Application.findById(applicationId);
    if (!application)
      return res.status(404).json({ message: "Application not found" });

    const job = await Job.findById(application.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.companyId.toString() !== companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: You do not own this job" });
    }

    application.status = status;
    // Push a single system notification containing the exact custom message
    application.notifications.push({
      message: customMessage,
      read: false,
      createdAt: new Date(),
    } as any);
    await application.save();

    // Send an email notification to the employee using existing utils
    try {
      const [employee, companyDoc] = await Promise.all([
        Employee.findById(application.employeeId).select('name email'),
        Company.findById(companyId).select('companyName logo')
      ]);

      if (employee?.email) {
        if (status === 'hired') {
          // Send special hired notification email
          await sendEmail({
            type: 'hiredNotification',
            to: employee.email,
            data: {
              employeeName: employee.name,
              companyName: companyDoc?.companyName || 'Our Company',
              jobTitle: job.title,
              customMessage: customMessage,
              logo: (companyDoc as any)?.logo?.url || process.env.APP_LOGO || '',
            } as any,
          });
        } else {
          // Send generic status update email for other statuses
          const subjectStatus = status.charAt(0).toUpperCase() + status.slice(1);
          await sendEmail({
            type: 'contactReply',
            to: employee.email,
            data: {
              contactName: employee.name,
              subject: `Application status updated: ${subjectStatus}`,
              content: customMessage,
              logo: (companyDoc as any)?.logo?.url || process.env.APP_LOGO || '',
              companyName: companyDoc?.companyName || 'Recruitment Team',
            } as any,
          });
        }
      }
    } catch (emailErr) {
      console.error('Failed to send application status email', emailErr);
    }

    res
      .status(200)
      .json({ message: "Application status updated", application });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Browse employees list (basic directory). Future: add filters by jobPreferences.
 */
export const browseEmployees = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) return res.status(403).json({ message: "Access Denied" });
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Lazy import to avoid circular
    const { default: Employee } = await import("../models/Employee");
    const { category } = req.query as { category?: string };
    const query: any = {};
    if (category && typeof category === 'string') {
      query.jobPreferences = { $in: [category] };
    }
    
    const [employees, total] = await Promise.all([
      Employee.find(query).select("-password -role").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Employee.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    res.status(200).json({ 
      message: "Employees retrieved", 
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
    console.error("Error browsing employees:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Send a work request from company to employee
 */
export const sendWorkRequest = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    const { employeeId, message } = req.body as {
      employeeId: string;
      message?: string;
    };

    if (!companyId) {
      return res.status(403).json({ message: "Access Denied" });
    }

    if (!Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: "Invalid employeeId" });
    }

    // Check if request already exists
    const existingRequest = await WorkRequest.findOne({ companyId, employeeId });
    if (existingRequest) {
      return res.status(400).json({
        message: "You have already sent a work request to this employee",
      });
    }

    // 🔹 Fetch company and employee
    const company = await Company.findById(companyId).select("companyName email");
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const employee = await Employee.findById(employeeId).select("name email");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Create work request with initial employee notification
    const work = await WorkRequest.create({
      companyId,
      employeeId,
      message,
      notifications: [
        {
          message: "New work request received",
          read: false,
          createdAt: new Date(),
        } as any,
      ],
    });

    // 🔹 Send job offer email
    try {
      await sendEmail({
        type: "jobOffer",
        to: employee.email,
        data: {
          employeeName: employee.name,
          companyName: company.companyName,
          jobTitle: message || "Job Opportunity",
          jobDescription: message,
          logo: process.env.APP_LOGO, // static app logo
          acceptOfferLink: `${process.env.APP_URL}/offers/${work._id}/accept`,
          offerExpiryDate: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toDateString(), // expires in 7 days
        },
      });
    } catch (emailError) {
      console.error("Failed to send job offer email", emailError);
    }


    res.status(201).json({ message: "Work request sent", work });
  } catch (error) {
    console.error("Error sending work request:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllWorkRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { role } = req.user as { role: "company" | "employee" };

    if (!userId) return res.status(403).json({ message: "Access Denied" });

    const filter =
      role === "company"
        ? { companyId: userId }
        : { employeeId: userId };

    const requests = await WorkRequest.find(filter)
      .populate("companyId", "companyName email")
      .populate(
        "employeeId",
        "name email dateOfBirth documents profileImage about education experience jobPreferences skills district province gender"
      );

    res.status(200).json({
      message: "All work requests retrieved successfully",
      requests,
    });
  } catch (error) {
    console.error("Error fetching work requests:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteWorkRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) return res.status(403).json({ message: 'Access Denied' });
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid request id' });

    const wr = await WorkRequest.findById(id);
    if (!wr) return res.status(404).json({ message: 'Work request not found' });

    // Check ownership
    if (
      wr.companyId.toString() !== userId &&
      wr.employeeId.toString() !== userId
    ) {
      return res.status(403).json({ message: 'Access Denied' });
    }

    await wr.deleteOne();

    res.status(200).json({ message: 'Work request deleted successfully' });
  } catch (error) {
    console.error('Error deleting work request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Upload company logo
 */
export const uploadLogo = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: Company ID not found in token" });
    }

    const logoFile = parseSingleFile((req.body as any).logo);
    if (!logoFile) {
      return res.status(400).json({ message: "No logo file uploaded" });
    }

    const company = await updateSingleFileField(Company as any, companyId, 'logo', logoFile) as any;

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({ message: "Logo uploaded successfully", company });
  } catch (error) {
    console.error("Error uploading logo:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Upload company documents
 */
export const uploadDocuments = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: Company ID not found in token" });
    }

    // Restrict modifying documents after approval
    const companyStatus = await Company.findById(companyId).select("isApproved status");
    if (companyStatus?.isApproved && companyStatus.status === 'approved') {
      return res.status(403).json({ message: "Documents cannot be modified after approval" });
    }

    const documents = parseMultipleFiles((req.body as any).documents);
    if (!documents || documents.length === 0) {
      return res.status(400).json({ message: "No documents uploaded" });
    }

    const company = await pushMultipleFiles(Company as any, companyId, 'documents', documents) as any;

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    await recomputeProfileCompletionStatus(companyId);
    const refreshed = await Company.findById(companyId).select("-password");

    res
      .status(200)
      .json({ message: "Documents uploaded successfully", company: refreshed });
  } catch (error) {
    console.error("Error uploading documents:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update company logo
 */
export const updateLogo = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: Company ID not found in token" });
    }

    const logoFile = parseSingleFile((req.body as any).logo);
    if (!logoFile) {
      return res.status(400).json({ message: "No logo file uploaded" });
    }

    const company = await updateSingleFileField(Company as any, companyId, 'logo', logoFile) as any;

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({ message: "Logo updated successfully", company });
  } catch (error) {
    console.error("Error updating logo:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update company documents
 */
export const updateDocuments = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: Company ID not found in token" });
    }

    // Restrict modifying documents after approval
    const companyStatus = await Company.findById(companyId).select("isApproved status");
    if (companyStatus?.isApproved && companyStatus.status === 'approved') {
      return res.status(403).json({ message: "Documents cannot be modified after approval" });
    }

    const documents = parseMultipleFiles((req.body as any).documents);
    if (!documents || documents.length === 0) {
      return res.status(400).json({ message: "No documents provided" });
    }

    const company = await replaceMultipleFiles(Company as any, companyId, 'documents', documents) as any;

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    await recomputeProfileCompletionStatus(companyId);
    const refreshed = await Company.findById(companyId).select("-password");

    res
      .status(200)
      .json({ message: "Documents updated successfully", company: refreshed });
  } catch (error) {
    console.error("Error updating documents:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete company logo
 */
export const deleteLogo = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: Company ID not found in token" });
    }

    const current = await Company.findById(companyId).select("logo");
    if (!current) return res.status(404).json({ message: "Company not found" });
    const publicId = (current as any)?.logo?.public_id as string | undefined;

    if (publicId) {
      try {
        cloudinarySdk.config({
          cloud_name: cloudinary.cloudName,
          api_key: cloudinary.apiKey,
          api_secret: cloudinary.apiSecret,
        });
        await cloudinarySdk.uploader.destroy(publicId);
      } catch (e) {
        // Non-fatal: proceed with DB update regardless
      }
    }

    const company = await Company.findByIdAndUpdate(
      companyId,
      { $unset: { logo: 1 } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({ message: "Logo deleted successfully", company });
  } catch (error) {
    console.error("Error deleting logo:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete specific document by index
 */
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    const { index } = req.params;

    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Access Denied: Company ID not found in token" });
    }

    // Restrict modifying documents after approval
    const companyStatus = await Company.findById(companyId).select("isApproved status");
    if (companyStatus?.isApproved && companyStatus.status === 'approved') {
      return res.status(403).json({ message: "Documents cannot be modified after approval" });
    }

    const documentIndex = parseInt(index);
    if (isNaN(documentIndex) || documentIndex < 0) {
      return res.status(400).json({ message: "Invalid document index" });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (!company.documents || documentIndex >= company.documents.length) {
      return res.status(400).json({ message: "Document index out of range" });
    }

    const doc: any = (company.documents as any[])[documentIndex];
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
        // ignore errors from cloudinary delete
      }
    }

    company.documents.splice(documentIndex, 1);
    await company.save();

    await recomputeProfileCompletionStatus(companyId);
    const refreshed = await Company.findById(companyId).select("-password");

    res
      .status(200)
      .json({ message: "Document deleted successfully", company: refreshed });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Toggle a job's active status (activate/deactivate), owned by the authenticated company
 */
export const toggleJobStatus = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    const { id } = req.params as { id: string };
    const { isActive } = req.body as { isActive: boolean };

    if (!companyId) {
      return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
    }
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Job ID' });
    }
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.companyId.toString() !== companyId) {
      return res.status(403).json({ message: 'Access Denied: You do not own this job' });
    }

    job.isActive = isActive;
    await job.save();

    res.status(200).json({ message: 'Job status updated', job });
  } catch (error) {
    console.error('Error toggling job status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get employees whose jobPreferences match a job's category
 * GET /company/job/:jobId/matched-employees
 */
export const getMatchedEmployeesForJob = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    const { jobId } = req.params;
    if (!companyId) {
      return res.status(403).json({ message: "Access Denied: Company ID not found in token" });
    }
    if (!Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid Job ID" });
    }
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.companyId.toString() !== companyId) {
      return res.status(403).json({ message: "Access Denied: You do not own this job" });
    }
    const matchedEmployees = await (await import("../models/Employee")).default.find({
      jobPreferences: { $in: [job.category] }
    }).select("-password -role");
    res.status(200).json({ matchedEmployees });
  } catch (error) {
    console.error("Error getting matched employees for job:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Determine if a company's profile has enough info to be submitted for review
const isProfileReadyForReview = (
  about?: string,
  documents?: IFileInfo[] | null
) => {
  const hasAbout = typeof about === "string" && about.trim().length > 0;
  const hasDocs = Array.isArray(documents) && documents.length > 0;
  return hasAbout && hasDocs;
};

// Recompute and persist the company's profileCompletionStatus based on current data
const recomputeProfileCompletionStatus = async (companyId: string) => {
  const company = await Company.findById(companyId).select(
    "about documents isApproved status profileCompletionStatus"
  );
  if (!company) return null;

  let nextStatus: "incomplete" | "pending_review" | "complete" = "incomplete";

  // If already approved and active, mark as complete
  if (company.isApproved && company.status === "approved") {
    nextStatus = "complete";
  } else if (
    isProfileReadyForReview(company.about as any, company.documents as any)
  ) {
    nextStatus = "pending_review";
  }

  if (company.profileCompletionStatus !== nextStatus) {
    await Company.findByIdAndUpdate(companyId, {
      $set: {
        profileCompletionStatus: nextStatus,
        // Only set completedAt when truly complete (admin approved)
        ...(nextStatus === "complete"
          ? { profileCompletedAt: new Date() }
          : {}),
      },
    });
  }

  return nextStatus;
};

/**
 * Get company notifications
 */
export const getCompanyNotifications = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    
    if (!companyId) {
      return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get notifications from company document, work requests, and applications
    const [companyDoc, workRequests, jobDocs] = await Promise.all([
      Company.findById(companyId).select('notifications'),
      WorkRequest.find({ companyId }).select('notifications'),
      Job.find({ companyId }).select('_id')
    ]);
    const jobIds = jobDocs.map(j => j._id);
    const applications = await Application.find({ jobId: { $in: jobIds } }).select('notifications');

    const companyNotifications = (companyDoc?.notifications as any[]) || [];
    const workRequestNotifications = workRequests.flatMap(wr => wr.notifications as any[]);
    const applicationNotifications = applications.flatMap(app => app.notifications as any[]);

    const allNotifications = [
      ...companyNotifications,
      ...workRequestNotifications,
      ...applicationNotifications,
    ];

    // Sort by creation date (newest first)
    allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const total = allNotifications.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedNotifications = allNotifications.slice(skip, skip + limit);

    res.status(200).json({ 
      message: 'Company notifications retrieved successfully', 
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
    console.error('Error getting company notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Mark company notification as read
 */
export const markCompanyNotificationRead = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    const { notificationId } = req.params;

    if (!companyId) {
      return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
    }

    if (!Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }
    // Try update on Company.notifications first
    const companyUpdated = await Company.updateOne(
      { _id: companyId, 'notifications._id': notificationId },
      { $set: { 'notifications.$.read': true } }
    );

    // Find and update notification in work requests
    const workRequestUpdated = await WorkRequest.updateOne(
      { 
        companyId, 
        'notifications._id': notificationId 
      },
      { 
        $set: { 
          'notifications.$.read': true 
        } 
      }
    );

    // Find and update notification in applications
    const jobIds = (await Job.find({ companyId }).select('_id')).map(j => j._id);
    const applicationUpdated = await Application.updateOne(
      { 
        jobId: { $in: jobIds }, 
        'notifications._id': notificationId 
      },
      { 
        $set: { 
          'notifications.$.read': true 
        } 
      }
    );

    if (
      companyUpdated.modifiedCount === 0 &&
      workRequestUpdated.modifiedCount === 0 &&
      applicationUpdated.modifiedCount === 0
    ) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking company notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete company notification
 */
export const deleteCompanyNotification = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    const { notificationId } = req.params;

    if (!companyId) {
      return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
    }

    if (!Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }
    // Try delete from Company.notifications first
    const companyUpdated = await Company.updateOne(
      { _id: companyId, 'notifications._id': notificationId },
      { $pull: { notifications: { _id: notificationId } } }
    );

    // Find and delete notification from work requests
    const workRequestUpdated = await WorkRequest.updateOne(
      { 
        companyId, 
        'notifications._id': notificationId 
      },
      { 
        $pull: { 
          notifications: { _id: notificationId } 
        } 
      }
    );

    // Find and delete notification from applications
    const jobIds = (await Job.find({ companyId }).select('_id')).map(j => j._id);
    const applicationUpdated = await Application.updateOne(
      { 
        jobId: { $in: jobIds }, 
        'notifications._id': notificationId 
      },
      { 
        $pull: { 
          notifications: { _id: notificationId } 
        } 
      }
    );

    if (
      companyUpdated.modifiedCount === 0 &&
      workRequestUpdated.modifiedCount === 0 &&
      applicationUpdated.modifiedCount === 0
    ) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting company notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

