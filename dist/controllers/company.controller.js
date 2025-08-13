"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWorkRequest = exports.browseEmployees = exports.updateApplicationStatus = exports.getApplicantsForJob = exports.getCompanyJobs = exports.postJob = exports.completeCompanyProfile = exports.updateProfile = exports.getProfile = void 0;
const Company_1 = __importDefault(require("../models/Company"));
const Job_1 = __importDefault(require("../models/Job"));
const Application_1 = __importDefault(require("../models/Application"));
const mongoose_1 = require("mongoose");
const WorkRequest_1 = __importDefault(require("../models/WorkRequest"));
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
const getProfile = async (req, res) => {
    try {
        const companyId = req.user?.id;
        if (!companyId) {
            return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
        }
        const company = await Company_1.default.findById(companyId).select('-password'); // Exclude password
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(200).json({ message: 'Company profile retrieved successfully', company });
    }
    catch (error) {
        console.error('Error getting company profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getProfile = getProfile;
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
const updateProfile = async (req, res) => {
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
        const company = await Company_1.default.findByIdAndUpdate(companyId, { $set: updates }, { new: true, runValidators: true }).select('-password');
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(200).json({ message: 'Company profile updated successfully', company });
    }
    catch (error) {
        console.error('Error updating company profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateProfile = updateProfile;
/**
 * Next-step completion endpoint for companies to provide missing details
 * Expects: about (string), documents (array of strings or single string)
 */
const completeCompanyProfile = async (req, res) => {
    try {
        const companyId = req.user?.id;
        if (!companyId) {
            return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
        }
        const { about, documents } = req.body;
        const set = {};
        if (typeof about === 'string')
            set.about = about;
        if (documents)
            set.documents = Array.isArray(documents) ? documents : [documents];
        const company = await Company_1.default.findByIdAndUpdate(companyId, { $set: set }, { new: true, runValidators: true }).select('-password');
        if (!company)
            return res.status(404).json({ message: 'Company not found' });
        res.status(200).json({ message: 'Company details submitted for review', company });
    }
    catch (error) {
        console.error('Error completing company profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.completeCompanyProfile = completeCompanyProfile;
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
const postJob = async (req, res) => {
    try {
        const companyId = req.user?.id;
        if (!companyId) {
            return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
        }
        const { title, description, image, skills, experience, employmentType, salary, category, benefits } = req.body;
        if (!title || !description || !employmentType || !category) {
            return res.status(400).json({ message: 'Please provide title, description, employment type, and category' });
        }
        const job = await Job_1.default.create({
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
        console.log("created Job is:", job);
        res.status(201).json({ message: 'Job posted successfully', job });
    }
    catch (error) {
        console.error('Error posting job:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.postJob = postJob;
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
const getCompanyJobs = async (req, res) => {
    try {
        const companyId = req.user?.id;
        if (!companyId) {
            return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
        }
        const jobs = await Job_1.default.find({ companyId });
        res.status(200).json({ message: 'Jobs retrieved successfully', jobs });
    }
    catch (error) {
        console.error('Error getting company jobs:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getCompanyJobs = getCompanyJobs;
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
const getApplicantsForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const companyId = req.user?.id;
        if (!companyId) {
            return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
        }
        if (!mongoose_1.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({ message: 'Invalid Job ID' });
        }
        const job = await Job_1.default.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        // Ensure the job belongs to the requesting company
        if (job.companyId.toString() !== companyId) {
            return res.status(403).json({ message: 'Access Denied: You do not own this job' });
        }
        const applicants = await Application_1.default.find({ jobId }).populate('employeeId', 'name email phoneNumber'); // Populate employee details
        res.status(200).json({ message: 'Applicants retrieved successfully', applicants });
    }
    catch (error) {
        console.error('Error getting applicants for job:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getApplicantsForJob = getApplicantsForJob;
/**
 * Update an application's status (reviewed/interview/hired/rejected) and notify the applicant
 */
const updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status } = req.body;
        const companyId = req.user?.id;
        if (!companyId) {
            return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
        }
        if (!mongoose_1.Types.ObjectId.isValid(applicationId)) {
            return res.status(400).json({ message: 'Invalid Application ID' });
        }
        if (!status || !['pending', 'reviewed', 'interview', 'hired', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        const application = await Application_1.default.findById(applicationId);
        if (!application)
            return res.status(404).json({ message: 'Application not found' });
        const job = await Job_1.default.findById(application.jobId);
        if (!job)
            return res.status(404).json({ message: 'Job not found' });
        if (job.companyId.toString() !== companyId) {
            return res.status(403).json({ message: 'Access Denied: You do not own this job' });
        }
        application.status = status;
        application.notifications.push({
            message: `Your application status has been updated to "${status}"`,
            read: false,
            createdAt: new Date(),
        });
        await application.save();
        res.status(200).json({ message: 'Application status updated', application });
    }
    catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
/**
 * Browse employees list (basic directory). Future: add filters by jobPreferences.
 */
const browseEmployees = async (req, res) => {
    try {
        const companyId = req.user?.id;
        if (!companyId)
            return res.status(403).json({ message: 'Access Denied' });
        // Lazy import to avoid circular
        const { default: Employee } = await Promise.resolve().then(() => __importStar(require('../models/Employee')));
        const employees = await Employee.find().select('name email phoneNumber jobPreferences skills');
        res.status(200).json({ message: 'Employees retrieved', employees });
    }
    catch (error) {
        console.error('Error browsing employees:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.browseEmployees = browseEmployees;
/**
 * Send a work request from company to employee
 */
const sendWorkRequest = async (req, res) => {
    try {
        const companyId = req.user?.id;
        const { employeeId, message } = req.body;
        if (!companyId)
            return res.status(403).json({ message: 'Access Denied' });
        if (!mongoose_1.Types.ObjectId.isValid(employeeId))
            return res.status(400).json({ message: 'Invalid employeeId' });
        const work = await WorkRequest_1.default.create({ companyId, employeeId, message, notifications: [{ message: 'New work request received', read: false, createdAt: new Date() }] });
        res.status(201).json({ message: 'Work request sent', work });
    }
    catch (error) {
        console.error('Error sending work request:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.sendWorkRequest = sendWorkRequest;
