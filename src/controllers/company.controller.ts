/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import Company from '../models/Company';
import Job from '../models/Job';
import Application from '../models/Application';
import { Types } from 'mongoose';
import WorkRequest from '../models/WorkRequest';
import { comparePasswords, hashPassword } from '../utils/authUtils';
import { IFileInfo } from '../types/models';

/**
* @swagger
* tags:
*   name: Company
*   description: Company specific operations
*/

/**
* @swagger
* /api/company/profile:
*   get:
*     summary: Get company profile
*     tags: [Company]
*     security:
*       - bearerAuth: []
*     responses:
*       200:
*         description: Company profile retrieved successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Company profile retrieved successfully
*                 company:
*                   $ref: '#/components/schemas/Company'
*       403:
*         description: Access Denied
*       404:
*         description: Company not found
*       500:
*         description: Server error
*/
export const getProfile = async (req: Request, res: Response) => {
try {
  const companyId = req.user?.id;
  if (!companyId) {
    return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
  }

  const company = await Company.findById(companyId).select('-password'); // Exclude password
  if (!company) {
    return res.status(404).json({ message: 'Company not found' });
  }

  // Provide a status notice for frontend popup/banner
  let statusNotice: string | undefined;
  if (company.status === 'approved' && company.profileCompletionStatus === 'complete') {
    statusNotice = 'Your company is approved. You can now post jobs.';
  } else if (company.profileCompletionStatus === 'complete' && company.status === 'pending') {
    statusNotice = 'Congratulations! You have completed your profile. Please wait for admin approval.';
  } else if (company.profileCompletionStatus === 'pending_review') {
    statusNotice = 'Your profile has been submitted and is pending admin review.';
  } else if (company.profileCompletionStatus === 'incomplete') {
    statusNotice = 'Complete your profile to unlock job posting and other features.';
  }

  res.status(200).json({ message: 'Company profile retrieved successfully', company, statusNotice });
} catch (error) {
  console.error('Error getting company profile:', error);
  res.status(500).json({ message: 'Server error' });
}
};

/**
* @swagger
* /api/company/profile:
*   patch:
*     summary: Update company profile
*     tags: [Company]
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               companyName:
*                 type: string
*                 example: Tech Solutions Inc. (Updated)
*               location:
*                 type: string
*                 example: San Francisco, USA
*               phoneNumber:
*                 type: string
*                 example: "+1122334455"
*               website:
*                 type: string
*                 example: https://www.techsolutions-updated.com
*               logo:
*                 type: string
*                 example: https://example.com/new_logo.png
*     responses:
*       200:
*         description: Company profile updated successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Company profile updated successfully
*                 company:
*                   $ref: '#/components/schemas/Company'
*       403:
*         description: Access Denied
*       404:
*         description: Company not found
*       500:
*         description: Server error
*/
export const updateProfile = async (req: Request, res: Response) => {
try {
  const companyId = req.user?.id;
  if (!companyId) {
    return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
  }

  const { oldPassword, newPassword, logo, documents, ...updates } = req.body;
  
  // Prevent updating sensitive fields like email, role, isApproved via this endpoint
  delete updates.email;
  delete updates.role;
  delete updates.isApproved;

  // Block file fields here; they must go through dedicated endpoints to ensure proper FileInfo typing
  delete (updates as any).logo;
  delete (updates as any).documents;

  // Handle password change if new password is provided
  if (newPassword) {
    if (!oldPassword) {
      return res.status(400).json({ message: 'Old password is required when setting a new password' });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const isMatch = await comparePasswords(oldPassword, company.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid old password' });
    }

    updates.password = await hashPassword(newPassword);
  }

  const company = await Company.findByIdAndUpdate(companyId, { $set: updates }, { new: true, runValidators: true }).select('-password');
  if (!company) {
    return res.status(404).json({ message: 'Company not found' });
  }

  // Recompute profile completion state if relevant fields changed (e.g., about)
  await recomputeProfileCompletionStatus(companyId);
  const refreshed = await Company.findById(companyId).select('-password');

  res.status(200).json({ message: 'Company profile updated successfully', company: refreshed });
} catch (error) {
  console.error('Error updating company profile:', error);
  res.status(500).json({ message: 'Server error' });
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
      return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
    }



    const bodyAny = req.body as any;
    const about = typeof bodyAny.about === 'string' ? bodyAny.about : undefined;
    const logo = bodyAny.logo as IFileInfo | undefined;
    const rawDocs = bodyAny.documents as any;
    const documents: IFileInfo[] | undefined = Array.isArray(rawDocs) ? rawDocs : rawDocs ? [rawDocs] : undefined;

    const set: any = {};
    if (typeof about === 'string') set.about = about;
    if (logo) set.logo = logo;
    if (documents && Array.isArray(documents)) set.documents = documents;
    
    // Do NOT mark as complete here. Mark as pending_review if criteria met.
    // Admin approval will mark it as complete later.

    const company = await Company.findByIdAndUpdate(
      companyId,
      { $set: set },
      { new: true, runValidators: true }
    ).select('-password');

    if (!company) return res.status(404).json({ message: 'Company not found' });

    await recomputeProfileCompletionStatus(companyId);
    const refreshed = await Company.findById(companyId).select('-password');

    res.status(200).json({ message: 'Company profile submitted for review', company: refreshed });
  } catch (error) {
    console.error('Error completing company profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
* @swagger
* /api/company/job:
*   post:
*     summary: Post a new job
*     tags: [Company]
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - title
*               - description
*               - employmentType
*               - category
*             properties:
*               title:
*                 type: string
*                 example: Software Engineer
*               description:
*                 type: string
*                 example: We are looking for a skilled software engineer...
*               skills:
*                 type: array
*                 items:
*                   type: string
*                 example: ["Node.js", "React", "MongoDB"]
*               experience:
*                 type: string
*                 example: 3+ years
*               employmentType:
*                 type: string
*                 enum: [fulltime, part-time, internship]
*                 example: fulltime
*               salary:
*                 type: string
*                 example: $80,000 - $120,000
*               category:
*                 type: string
*                 example: IT & Software
*     responses:
*       201:
*         description: Job posted successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Job posted successfully
*                 job:
*                   $ref: '#/components/schemas/Job'
*       400:
*         description: Bad request (e.g., missing fields)
*       403:
*         description: Access Denied (e.g., company not approved)
*       500:
*         description: Server error
*/
export const postJob = async (req: Request, res: Response) => {
try {
  const companyId = req.user?.id;
  if (!companyId) {
    return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
  }

  const { title, description, image, skills, experience, employmentType, salary, category, benefits } = req.body;

  if (!title || !description || !employmentType || !category) {
    return res.status(400).json({ message: 'Please provide title, description, employment type, and category' });
  }

  const job = await Job.create({
    title,
    description,
    skills,
    image: image.url,
    experience,
    employmentType,
    salary,
    category,
    benefits: Array.isArray(benefits) ? benefits : [],
    companyId,
  });

  console.log("created Job is:",job)

  res.status(201).json({ message: 'Job posted successfully', job });
} catch (error) {
  console.error('Error posting job:', error);
  res.status(500).json({ message: 'Server error' , error});
}
};

/**
* @swagger
* /api/company/jobs:
*   get:
*     summary: Get all jobs posted by the company
*     tags: [Company]
*     security:
*       - bearerAuth: []
*     responses:
*       200:
*         description: Jobs retrieved successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Jobs retrieved successfully
*                 jobs:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/Job'
*       403:
*         description: Access Denied
*       500:
*         description: Server error
*/
export const getCompanyJobs = async (req: Request, res: Response) => {
try {
  const companyId = req.user?.id;
  if (!companyId) {
    return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
  }

  const jobs = await Job.find({ companyId });
  res.status(200).json({ message: 'Jobs retrieved successfully', jobs });
} catch (error) {
  console.error('Error getting company jobs:', error);
  res.status(500).json({ message: 'Server error' });
}
};

/**
* @swagger
* /api/company/applicants/{jobId}:
*   get:
*     summary: Get applicants for a specific job posted by the company
*     tags: [Company]
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: path
*         name: jobId
*         required: true
*         schema:
*           type: string
*           format: mongo-id
*         description: ID of the job to get applicants for
*     responses:
*       200:
*         description: Applicants retrieved successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Applicants retrieved successfully
*                 applicants:
*                   type: array
*                   items:
*                     type: object
*                     properties:
*                       _id:
*                         type: string
*                         example: 60d5ec49f8c7d00015f8e3b1
*                       jobId:
*                         type: string
*                         example: 60d5ec49f8c7d00015f8e3b0
*                       employeeId:
*                         type: object
*                         properties:
*                           _id:
*                             type: string
*                             example: 60d5ec49f8c7d00015f8e3b2
*                           name:
*                             type: string
*                             example: Jane Doe
*                           email:
*                             type: string
*                             example: jane.doe@example.com
*                           phoneNumber:
*                             type: string
*                             example: "+1123456789"
*                       skills:
*                         type: array
*                         items:
*                           type: string
*                         example: ["Python", "Data Analysis"]
*                       experience:
*                         type: string
*                         example: 2 years in data science
*                       appliedVia:
*                         type: string
*                         example: normal
*                       status:
*                         type: string
*                         example: pending
*                       createdAt:
*                         type: string
*                         format: date-time
*       400:
*         description: Invalid Job ID
*       403:
*         description: Access Denied (e.g., job not owned by company)
*       404:
*         description: Job not found
*       500:
*         description: Server error
*/
export const getApplicantsForJob = async (req: Request, res: Response) => {
try {
  const { jobId } = req.params;
  const companyId = req.user?.id;

  if (!companyId) {
    return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
  }

  if (!Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ message: 'Invalid Job ID' });
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  // Ensure the job belongs to the requesting company
  if (job.companyId.toString() !== companyId) {
    return res.status(403).json({ message: 'Access Denied: You do not own this job' });
  }

  const applicants = await Application.find({ jobId }).populate('employeeId', 'name email phoneNumber'); // Populate employee details
  res.status(200).json({ message: 'Applicants retrieved successfully', applicants });
} catch (error) {
  console.error('Error getting applicants for job:', error);
  res.status(500).json({ message: 'Server error' });
}
};

/**
 * Update an application's status (reviewed/interview/hired/rejected) and notify the applicant
 */
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params as { applicationId: string };
    const { status } = req.body as { status: 'pending' | 'reviewed' | 'interview' | 'hired' | 'rejected' };
    const companyId = req.user?.id;

    if (!companyId) {
      return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
    }
    if (!Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: 'Invalid Application ID' });
    }
    if (!status || !['pending', 'reviewed', 'interview', 'hired', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const job = await Job.findById(application.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.companyId.toString() !== companyId) {
      return res.status(403).json({ message: 'Access Denied: You do not own this job' });
    }

    application.status = status;
    application.notifications.push({
      message: `Your application status has been updated to "${status}"`,
      read: false,
      createdAt: new Date(),
    } as any);
    await application.save();

    res.status(200).json({ message: 'Application status updated', application });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Browse employees list (basic directory). Future: add filters by jobPreferences.
 */
export const browseEmployees = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) return res.status(403).json({ message: 'Access Denied' });
    // Lazy import to avoid circular
    const { default: Employee } = await import('../models/Employee');
    const employees = await Employee.find().select('name email phoneNumber jobPreferences skills');
    res.status(200).json({ message: 'Employees retrieved', employees });
  } catch (error) {
    console.error('Error browsing employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Send a work request from company to employee
 */
export const sendWorkRequest = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    const { employeeId, message } = req.body as { employeeId: string; message?: string };
    if (!companyId) return res.status(403).json({ message: 'Access Denied' });
    if (!Types.ObjectId.isValid(employeeId)) return res.status(400).json({ message: 'Invalid employeeId' });
    const work = await WorkRequest.create({ companyId, employeeId, message, notifications: [{ message: 'New work request received', read: false, createdAt: new Date() } as any] });
    res.status(201).json({ message: 'Work request sent', work });
  } catch (error) {
    console.error('Error sending work request:', error);
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
      return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
    }

    const logoFile = req.body.logo as IFileInfo;
    if (!logoFile) {
      return res.status(400).json({ message: 'No logo file uploaded' });
    }

    const company = await Company.findByIdAndUpdate(
      companyId,
      { logo: logoFile },
      { new: true, runValidators: true }
    ).select('-password');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json({ message: 'Logo uploaded successfully', company });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Upload company documents
 */
export const uploadDocuments = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
    }

    console.log('=== uploadDocuments DEBUG ===');
    console.log('req.body:', JSON.stringify(req.body, null, 2));
    console.log('===================================');

    const rawDocs = (req.body as any).documents as any;
    const documents: IFileInfo[] = Array.isArray(rawDocs) ? rawDocs : rawDocs ? [rawDocs] : [];
    if (!documents || documents.length === 0) {
      return res.status(400).json({ message: 'No documents uploaded' });
    }

    const company = await Company.findByIdAndUpdate(
      companyId,
      { $push: { documents: { $each: documents } } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    await recomputeProfileCompletionStatus(companyId);
    const refreshed = await Company.findById(companyId).select('-password');

    res.status(200).json({ message: 'Documents uploaded successfully', company: refreshed });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update company logo
 */
export const updateLogo = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
    }

    console.log('=== updateLogo DEBUG ===');
    console.log('req.body:', JSON.stringify(req.body, null, 2));
    console.log('===================================');

    const logoFile = req.body.logo as IFileInfo;
    if (!logoFile) {
      return res.status(400).json({ message: 'No logo file uploaded' });
    }

    const company = await Company.findByIdAndUpdate(
      companyId,
      { logo: logoFile },
      { new: true, runValidators: true }
    ).select('-password');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json({ message: 'Logo updated successfully', company });
  } catch (error) {
    console.error('Error updating logo:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update company documents
 */
export const updateDocuments = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
    }

    const rawDocs = (req.body as any).documents as any;
    const documents: IFileInfo[] = Array.isArray(rawDocs) ? rawDocs : rawDocs ? [rawDocs] : [];
    if (!documents || documents.length === 0) {
      return res.status(400).json({ message: 'No documents provided' });
    }

    const company = await Company.findByIdAndUpdate(
      companyId,
      { documents: documents },
      { new: true, runValidators: true }
    ).select('-password');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    await recomputeProfileCompletionStatus(companyId);
    const refreshed = await Company.findById(companyId).select('-password');

    res.status(200).json({ message: 'Documents updated successfully', company: refreshed });
  } catch (error) {
    console.error('Error updating documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete company logo
 */
export const deleteLogo = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
    }

    const company = await Company.findByIdAndUpdate(
      companyId,
      { $unset: { logo: 1 } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json({ message: 'Logo deleted successfully', company });
  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
    }

    const documentIndex = parseInt(index);
    if (isNaN(documentIndex) || documentIndex < 0) {
      return res.status(400).json({ message: 'Invalid document index' });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (!company.documents || documentIndex >= company.documents.length) {
      return res.status(400).json({ message: 'Document index out of range' });
    }

    company.documents.splice(documentIndex, 1);
    await company.save();

    await recomputeProfileCompletionStatus(companyId);
    const refreshed = await Company.findById(companyId).select('-password');

    res.status(200).json({ message: 'Document deleted successfully', company: refreshed });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Determine if a company's profile has enough info to be submitted for review
const isProfileReadyForReview = (about?: string, documents?: IFileInfo[] | null) => {
  const hasAbout = typeof about === 'string' && about.trim().length > 0;
  const hasDocs = Array.isArray(documents) && documents.length > 0;
  return hasAbout && hasDocs;
};

// Recompute and persist the company's profileCompletionStatus based on current data
const recomputeProfileCompletionStatus = async (companyId: string) => {
  const company = await Company.findById(companyId).select('about documents isApproved status profileCompletionStatus');
  if (!company) return null;

  let nextStatus: 'incomplete' | 'pending_review' | 'complete' = 'incomplete';

  // If already approved and active, mark as complete
  if (company.isApproved && company.status === 'approved') {
    nextStatus = 'complete';
  } else if (isProfileReadyForReview(company.about as any, company.documents as any)) {
    nextStatus = 'pending_review';
  }

  if (company.profileCompletionStatus !== nextStatus) {
    await Company.findByIdAndUpdate(companyId, {
      $set: {
        profileCompletionStatus: nextStatus,
        // Only set completedAt when truly complete (admin approved)
        ...(nextStatus === 'complete' ? { profileCompletedAt: new Date() } : {})
      }
    });
  }

  return nextStatus;
};
