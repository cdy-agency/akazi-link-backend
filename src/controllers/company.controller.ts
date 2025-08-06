/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import Company from '../models/Company';
import Job from '../models/Job';
import Application from '../models/Application';
import { Types } from 'mongoose';

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

  res.status(200).json({ message: 'Company profile retrieved successfully', company });
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

  const updates = req.body;
  // Prevent updating sensitive fields like email, password, role, isApproved via this endpoint
  delete updates.email;
  delete updates.password;
  delete updates.role;
  delete updates.isApproved;

  const company = await Company.findByIdAndUpdate(companyId, { $set: updates }, { new: true, runValidators: true }).select('-password');
  if (!company) {
    return res.status(404).json({ message: 'Company not found' });
  }

  res.status(200).json({ message: 'Company profile updated successfully', company });
} catch (error) {
  console.error('Error updating company profile:', error);
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

  const { title, description, skills, experience, employmentType, salary, category } = req.body;

  if (!title || !description || !employmentType || !category) {
    return res.status(400).json({ message: 'Please provide title, description, employment type, and category' });
  }

  const job = await Job.create({
    title,
    description,
    skills,
    experience,
    employmentType,
    salary,
    category,
    companyId,
  });

  res.status(201).json({ message: 'Job posted successfully', job });
} catch (error) {
  console.error('Error posting job:', error);
  res.status(500).json({ message: 'Server error' });
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
