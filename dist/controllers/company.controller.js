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
exports.deleteCompanyNotification = exports.markCompanyNotificationRead = exports.getCompanyNotifications = exports.deleteDocument = exports.deleteLogo = exports.updateDocuments = exports.updateLogo = exports.uploadDocuments = exports.uploadLogo = exports.sendWorkRequest = exports.browseEmployees = exports.updateApplicationStatus = exports.getApplicantsForJob = exports.getCompanyJobs = exports.postJob = exports.completeCompanyProfile = exports.updateProfile = exports.getProfile = void 0;
const Company_1 = __importDefault(require("../models/Company"));
const Job_1 = __importDefault(require("../models/Job"));
const Application_1 = __importDefault(require("../models/Application"));
const mongoose_1 = require("mongoose");
const WorkRequest_1 = __importDefault(require("../models/WorkRequest"));
const authUtils_1 = require("../utils/authUtils");
const fileUploadService_1 = require("../services/fileUploadService");
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
            return res
                .status(403)
                .json({ message: "Access Denied: Company ID not found in token" });
        }
        const company = await Company_1.default.findById(companyId).select("-password"); // Exclude password
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        // Provide a status notice for frontend popup/banner
        let statusNotice;
        if (company.status === "approved" &&
            company.profileCompletionStatus === "complete") {
            statusNotice = "Your company is approved. You can now post jobs.";
        }
        else if (company.profileCompletionStatus === "complete" &&
            company.status === "pending") {
            statusNotice =
                "Congratulations! You have completed your profile. Please wait for admin approval.";
        }
        else if (company.profileCompletionStatus === "pending_review") {
            statusNotice =
                "Your profile has been submitted and is pending admin review.";
        }
        else if (company.profileCompletionStatus === "incomplete") {
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
    }
    catch (error) {
        console.error("Error getting company profile:", error);
        res.status(500).json({ message: "Server error" });
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
            return res
                .status(403)
                .json({ message: "Access Denied: Company ID not found in token" });
        }
        const { oldPassword, newPassword, logo, documents, ...updates } = req.body;
        // Prevent updating sensitive fields like email, role, isApproved via this endpoint
        delete updates.email;
        delete updates.role;
        delete updates.isApproved;
        // Block file fields here; they must go through dedicated endpoints to ensure proper FileInfo typing
        delete updates.logo;
        delete updates.documents;
        // Handle password change if new password is provided
        if (newPassword) {
            if (!oldPassword) {
                return res
                    .status(400)
                    .json({
                    message: "Old password is required when setting a new password",
                });
            }
            const company = await Company_1.default.findById(companyId);
            if (!company) {
                return res.status(404).json({ message: "Company not found" });
            }
            const isMatch = await (0, authUtils_1.comparePasswords)(oldPassword, company.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid old password" });
            }
            updates.password = await (0, authUtils_1.hashPassword)(newPassword);
        }
        const company = await Company_1.default.findByIdAndUpdate(companyId, { $set: updates }, { new: true, runValidators: true }).select("-password");
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        // Recompute profile completion state if relevant fields changed (e.g., about)
        await recomputeProfileCompletionStatus(companyId);
        const refreshed = await Company_1.default.findById(companyId).select("-password");
        res
            .status(200)
            .json({
            message: "Company profile updated successfully",
            company: refreshed,
        });
    }
    catch (error) {
        console.error("Error updating company profile:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.updateProfile = updateProfile;
/**
 * Next-step completion endpoint for companies to provide missing details
 * Expects: about (string), logo (IFileInfo), documents (IFileInfo[])
 */
const completeCompanyProfile = async (req, res) => {
    try {
        const companyId = req.user?.id;
        if (!companyId) {
            return res
                .status(403)
                .json({ message: "Access Denied: Company ID not found in token" });
        }
        const bodyAny = req.body;
        const about = typeof bodyAny.about === "string" ? bodyAny.about : undefined;
        const logo = bodyAny.logo;
        const rawDocs = bodyAny.documents;
        const documents = Array.isArray(rawDocs)
            ? rawDocs
            : rawDocs
                ? [rawDocs]
                : undefined;
        const set = {};
        if (typeof about === "string")
            set.about = about;
        if (logo)
            set.logo = logo;
        if (documents && Array.isArray(documents))
            set.documents = documents;
        // Do NOT mark as complete here. Mark as pending_review if criteria met.
        // Admin approval will mark it as complete later.
        const company = await Company_1.default.findByIdAndUpdate(companyId, { $set: set }, { new: true, runValidators: true }).select("-password");
        if (!company)
            return res.status(404).json({ message: "Company not found" });
        await recomputeProfileCompletionStatus(companyId);
        const refreshed = await Company_1.default.findById(companyId).select("-password");
        res
            .status(200)
            .json({
            message: "Company profile submitted for review",
            company: refreshed,
        });
    }
    catch (error) {
        console.error("Error completing company profile:", error);
        res.status(500).json({ message: "Server error" });
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
            return res
                .status(403)
                .json({ message: "Access Denied: Company ID not found in token" });
        }
        const { title, description, image, skills, experience, location, salaryMin, salaryMax, employmentType, applicationDeadline, category, benefits, responsibilities, } = req.body;
        if (!title || !description || !employmentType || !category) {
            return res
                .status(400)
                .json({
                message: "Please provide title, description, employment type, and category",
            });
        }
        const job = await Job_1.default.create({
            title,
            description,
            location,
            skills,
            ...(image && typeof image === "object" ? { image } : {}),
            experience,
            employmentType,
            salaryMin,
            salaryMax,
            category,
            benefits: Array.isArray(benefits) ? benefits : [],
            responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
            applicationDeadline,
            companyId,
        });
        console.log("created Job is:", job);
        res.status(201).json({ message: "Job posted successfully", job });
    }
    catch (error) {
        console.error("Error posting job:", error);
        res.status(500).json({ message: "Server error", error });
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
            return res
                .status(403)
                .json({ message: "Access Denied: Company ID not found in token" });
        }
        const jobs = await Job_1.default.find({ companyId });
        res.status(200).json({ message: "Jobs retrieved successfully", jobs });
    }
    catch (error) {
        console.error("Error getting company jobs:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getCompanyJobs = getCompanyJobs;
const getApplicantsForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const companyId = req.user?.id;
        if (!companyId) {
            return res
                .status(403)
                .json({ message: "Access Denied: Company ID not found in token" });
        }
        if (!mongoose_1.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({ message: "Invalid Job ID" });
        }
        const job = await Job_1.default.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        // Ensure the job belongs to the requesting company
        if (job.companyId.toString() !== companyId) {
            return res
                .status(403)
                .json({ message: "Access Denied: You do not own this job" });
        }
        const applicants = await Application_1.default.find({ jobId }).populate("employeeId", "name email phoneNumber"); // Populate employee details
        res
            .status(200)
            .json({ message: "Applicants retrieved successfully", applicants });
    }
    catch (error) {
        console.error("Error getting applicants for job:", error);
        res.status(500).json({ message: "Server error" });
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
            return res
                .status(403)
                .json({ message: "Access Denied: Company ID not found in token" });
        }
        if (!mongoose_1.Types.ObjectId.isValid(applicationId)) {
            return res.status(400).json({ message: "Invalid Application ID" });
        }
        if (!status ||
            !["pending", "reviewed", "interview", "hired", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }
        const application = await Application_1.default.findById(applicationId);
        if (!application)
            return res.status(404).json({ message: "Application not found" });
        const job = await Job_1.default.findById(application.jobId);
        if (!job)
            return res.status(404).json({ message: "Job not found" });
        if (job.companyId.toString() !== companyId) {
            return res
                .status(403)
                .json({ message: "Access Denied: You do not own this job" });
        }
        application.status = status;
        application.notifications.push({
            message: `Your application status has been updated to "${status}"`,
            read: false,
            createdAt: new Date(),
        });
        await application.save();
        res
            .status(200)
            .json({ message: "Application status updated", application });
    }
    catch (error) {
        console.error("Error updating application status:", error);
        res.status(500).json({ message: "Server error" });
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
            return res.status(403).json({ message: "Access Denied" });
        // Lazy import to avoid circular
        const { default: Employee } = await Promise.resolve().then(() => __importStar(require("../models/Employee")));
        const employees = await Employee.find().select("name email phoneNumber jobPreferences skills");
        res.status(200).json({ message: "Employees retrieved", employees });
    }
    catch (error) {
        console.error("Error browsing employees:", error);
        res.status(500).json({ message: "Server error" });
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
            return res.status(403).json({ message: "Access Denied" });
        if (!mongoose_1.Types.ObjectId.isValid(employeeId))
            return res.status(400).json({ message: "Invalid employeeId" });
        const work = await WorkRequest_1.default.create({
            companyId,
            employeeId,
            message,
            notifications: [
                {
                    message: "New work request received",
                    read: false,
                    createdAt: new Date(),
                },
            ],
        });
        res.status(201).json({ message: "Work request sent", work });
    }
    catch (error) {
        console.error("Error sending work request:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.sendWorkRequest = sendWorkRequest;
/**
 * Upload company logo
 */
const uploadLogo = async (req, res) => {
    try {
        const companyId = req.user?.id;
        if (!companyId) {
            return res
                .status(403)
                .json({ message: "Access Denied: Company ID not found in token" });
        }
        const logoFile = (0, fileUploadService_1.parseSingleFile)(req.body.logo);
        if (!logoFile) {
            return res.status(400).json({ message: "No logo file uploaded" });
        }
        const company = await (0, fileUploadService_1.updateSingleFileField)(Company_1.default, companyId, 'logo', logoFile);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        res.status(200).json({ message: "Logo uploaded successfully", company });
    }
    catch (error) {
        console.error("Error uploading logo:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.uploadLogo = uploadLogo;
/**
 * Upload company documents
 */
const uploadDocuments = async (req, res) => {
    try {
        const companyId = req.user?.id;
        if (!companyId) {
            return res
                .status(403)
                .json({ message: "Access Denied: Company ID not found in token" });
        }
        console.log("=== uploadDocuments DEBUG ===");
        console.log("req.body:", JSON.stringify(req.body, null, 2));
        console.log("===================================");
        const documents = (0, fileUploadService_1.parseMultipleFiles)(req.body.documents);
        if (!documents || documents.length === 0) {
            return res.status(400).json({ message: "No documents uploaded" });
        }
        const company = await (0, fileUploadService_1.pushMultipleFiles)(Company_1.default, companyId, 'documents', documents);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        await recomputeProfileCompletionStatus(companyId);
        const refreshed = await Company_1.default.findById(companyId).select("-password");
        res
            .status(200)
            .json({ message: "Documents uploaded successfully", company: refreshed });
    }
    catch (error) {
        console.error("Error uploading documents:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.uploadDocuments = uploadDocuments;
/**
 * Update company logo
 */
const updateLogo = async (req, res) => {
    try {
        const companyId = req.user?.id;
        if (!companyId) {
            return res
                .status(403)
                .json({ message: "Access Denied: Company ID not found in token" });
        }
        console.log("=== updateLogo DEBUG ===");
        console.log("req.body:", JSON.stringify(req.body, null, 2));
        console.log("===================================");
        const logoFile = (0, fileUploadService_1.parseSingleFile)(req.body.logo);
        if (!logoFile) {
            return res.status(400).json({ message: "No logo file uploaded" });
        }
        const company = await (0, fileUploadService_1.updateSingleFileField)(Company_1.default, companyId, 'logo', logoFile);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        res.status(200).json({ message: "Logo updated successfully", company });
    }
    catch (error) {
        console.error("Error updating logo:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.updateLogo = updateLogo;
/**
 * Update company documents
 */
const updateDocuments = async (req, res) => {
    try {
        const companyId = req.user?.id;
        if (!companyId) {
            return res
                .status(403)
                .json({ message: "Access Denied: Company ID not found in token" });
        }
        const documents = (0, fileUploadService_1.parseMultipleFiles)(req.body.documents);
        if (!documents || documents.length === 0) {
            return res.status(400).json({ message: "No documents provided" });
        }
        const company = await (0, fileUploadService_1.replaceMultipleFiles)(Company_1.default, companyId, 'documents', documents);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        await recomputeProfileCompletionStatus(companyId);
        const refreshed = await Company_1.default.findById(companyId).select("-password");
        res
            .status(200)
            .json({ message: "Documents updated successfully", company: refreshed });
    }
    catch (error) {
        console.error("Error updating documents:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.updateDocuments = updateDocuments;
/**
 * Delete company logo
 */
const deleteLogo = async (req, res) => {
    try {
        const companyId = req.user?.id;
        if (!companyId) {
            return res
                .status(403)
                .json({ message: "Access Denied: Company ID not found in token" });
        }
        const company = await Company_1.default.findByIdAndUpdate(companyId, { $unset: { logo: 1 } }, { new: true, runValidators: true }).select("-password");
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        res.status(200).json({ message: "Logo deleted successfully", company });
    }
    catch (error) {
        console.error("Error deleting logo:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.deleteLogo = deleteLogo;
/**
 * Delete specific document by index
 */
const deleteDocument = async (req, res) => {
    try {
        const companyId = req.user?.id;
        const { index } = req.params;
        if (!companyId) {
            return res
                .status(403)
                .json({ message: "Access Denied: Company ID not found in token" });
        }
        const documentIndex = parseInt(index);
        if (isNaN(documentIndex) || documentIndex < 0) {
            return res.status(400).json({ message: "Invalid document index" });
        }
        const company = await Company_1.default.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        if (!company.documents || documentIndex >= company.documents.length) {
            return res.status(400).json({ message: "Document index out of range" });
        }
        company.documents.splice(documentIndex, 1);
        await company.save();
        await recomputeProfileCompletionStatus(companyId);
        const refreshed = await Company_1.default.findById(companyId).select("-password");
        res
            .status(200)
            .json({ message: "Document deleted successfully", company: refreshed });
    }
    catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.deleteDocument = deleteDocument;
// Determine if a company's profile has enough info to be submitted for review
const isProfileReadyForReview = (about, documents) => {
    const hasAbout = typeof about === "string" && about.trim().length > 0;
    const hasDocs = Array.isArray(documents) && documents.length > 0;
    return hasAbout && hasDocs;
};
// Recompute and persist the company's profileCompletionStatus based on current data
const recomputeProfileCompletionStatus = async (companyId) => {
    const company = await Company_1.default.findById(companyId).select("about documents isApproved status profileCompletionStatus");
    if (!company)
        return null;
    let nextStatus = "incomplete";
    // If already approved and active, mark as complete
    if (company.isApproved && company.status === "approved") {
        nextStatus = "complete";
    }
    else if (isProfileReadyForReview(company.about, company.documents)) {
        nextStatus = "pending_review";
    }
    if (company.profileCompletionStatus !== nextStatus) {
        await Company_1.default.findByIdAndUpdate(companyId, {
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
const getCompanyNotifications = async (req, res) => {
    try {
        const companyId = req.user?.id;
        if (!companyId) {
            return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
        }
        // Get notifications from work requests and applications
        const workRequests = await WorkRequest_1.default.find({ companyId }).select('notifications');
        const applications = await Application_1.default.find({
            jobId: { $in: await Job_1.default.find({ companyId }).select('_id') }
        }).select('notifications');
        const workRequestNotifications = workRequests.flatMap(wr => wr.notifications);
        const applicationNotifications = applications.flatMap(app => app.notifications);
        const allNotifications = [...workRequestNotifications, ...applicationNotifications];
        res.status(200).json({
            message: 'Company notifications retrieved successfully',
            notifications: allNotifications
        });
    }
    catch (error) {
        console.error('Error getting company notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getCompanyNotifications = getCompanyNotifications;
/**
 * Mark company notification as read
 */
const markCompanyNotificationRead = async (req, res) => {
    try {
        const companyId = req.user?.id;
        const { notificationId } = req.params;
        if (!companyId) {
            return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
        }
        if (!mongoose_1.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ message: 'Invalid notification ID' });
        }
        // Find and update notification in work requests
        const workRequestUpdated = await WorkRequest_1.default.updateOne({
            companyId,
            'notifications._id': notificationId
        }, {
            $set: {
                'notifications.$.read': true
            }
        });
        // Find and update notification in applications
        const jobIds = await Job_1.default.find({ companyId }).select('_id');
        const applicationUpdated = await Application_1.default.updateOne({
            jobId: { $in: jobIds },
            'notifications._id': notificationId
        }, {
            $set: {
                'notifications.$.read': true
            }
        });
        if (workRequestUpdated.modifiedCount === 0 && applicationUpdated.modifiedCount === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.status(200).json({ message: 'Notification marked as read' });
    }
    catch (error) {
        console.error('Error marking company notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.markCompanyNotificationRead = markCompanyNotificationRead;
/**
 * Delete company notification
 */
const deleteCompanyNotification = async (req, res) => {
    try {
        const companyId = req.user?.id;
        const { notificationId } = req.params;
        if (!companyId) {
            return res.status(403).json({ message: 'Access Denied: Company ID not found in token' });
        }
        if (!mongoose_1.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ message: 'Invalid notification ID' });
        }
        // Find and delete notification from work requests
        const workRequestUpdated = await WorkRequest_1.default.updateOne({
            companyId,
            'notifications._id': notificationId
        }, {
            $pull: {
                notifications: { _id: notificationId }
            }
        });
        // Find and delete notification from applications
        const jobIds = await Job_1.default.find({ companyId }).select('_id');
        const applicationUpdated = await Application_1.default.updateOne({
            jobId: { $in: jobIds },
            'notifications._id': notificationId
        }, {
            $pull: {
                notifications: { _id: notificationId }
            }
        });
        if (workRequestUpdated.modifiedCount === 0 && applicationUpdated.modifiedCount === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.status(200).json({ message: 'Notification deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting company notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteCompanyNotification = deleteCompanyNotification;
