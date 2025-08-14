"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectCompanyProfile = exports.getAllEmployees = exports.approveCompanyProfile = exports.getCompaniesPendingReview = exports.getLoggedInAdmin = exports.listAllUsers = exports.deleteCompany = exports.enableCompany = exports.disableCompany = exports.rejectCompany = exports.approveCompany = exports.getCompanies = exports.getEmployees = exports.updateAdminPassword = exports.adminLogin = void 0;
const User_1 = __importDefault(require("../models/User"));
const Company_1 = __importDefault(require("../models/Company"));
const Employee_1 = __importDefault(require("../models/Employee"));
const authUtils_1 = require("../utils/authUtils");
const mongoose_1 = require("mongoose");
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
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }
        const adminUser = await User_1.default.findOne({ email, role: 'superadmin' });
        if (!adminUser) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await (0, authUtils_1.comparePasswords)(password, adminUser.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = (0, authUtils_1.generateToken)({ id: adminUser._id.toString(), role: adminUser.role });
        res.status(200).json({ message: 'Admin login successful', token, role: adminUser.role });
    }
    catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.adminLogin = adminLogin;
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
const updateAdminPassword = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { image, email, currentPassword, newPassword } = req.body;
        if (!adminId) {
            return res.status(403).json({ message: 'Access Denied: Admin ID not found in token' });
        }
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new passwords' });
        }
        const adminUser = await User_1.default.findById(adminId);
        if (!adminUser || adminUser.role !== 'superadmin') {
            return res.status(404).json({ message: 'Admin user not found' });
        }
        const isMatch = await (0, authUtils_1.comparePasswords)(currentPassword, adminUser.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid current password' });
        }
        if (newPassword) {
            adminUser.password = await (0, authUtils_1.hashPassword)(newPassword);
        }
        if (image)
            adminUser.image = image.url;
        if (email)
            adminUser.email = email;
        await adminUser.save();
        res.status(200).json({ message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Error updating admin password:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateAdminPassword = updateAdminPassword;
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
const getEmployees = async (req, res) => {
    try {
        const employees = await Employee_1.default.find().select('-password'); // Exclude passwords
        res.status(200).json({ message: 'Employees retrieved successfully', employees });
    }
    catch (error) {
        console.error('Error getting employees:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getEmployees = getEmployees;
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
const getCompanies = async (req, res) => {
    try {
        const companies = await Company_1.default.find().select('-password'); // Exclude passwords
        res.status(200).json({ message: 'Companies retrieved successfully', companies });
    }
    catch (error) {
        console.error('Error getting companies:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getCompanies = getCompanies;
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
const approveCompany = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Approving company with ID:', id);
        console.log('ID type:', typeof id);
        console.log('ID length:', id?.length);
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            console.log('Invalid ObjectId:', id);
            return res.status(400).json({ message: 'Invalid Company ID' });
        }
        console.log('ObjectId is valid, searching for company...');
        const company = await Company_1.default.findByIdAndUpdate(id, {
            isApproved: true,
            status: 'approved',
            isActive: true
        }, { new: true }).select('-password');
        console.log('Company found:', company);
        if (!company) {
            console.log('Company not found in database');
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(200).json({ message: 'Company approved successfully', company });
    }
    catch (error) {
        console.error('Error approving company:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.approveCompany = approveCompany;
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
const rejectCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Company ID' });
        }
        if (!rejectionReason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }
        const company = await Company_1.default.findByIdAndUpdate(id, {
            isApproved: false,
            status: 'rejected',
            isActive: false,
            rejectionReason,
            rejectedAt: new Date()
        }, { new: true }).select('-password');
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(200).json({ message: 'Company rejected successfully', company });
    }
    catch (error) {
        console.error('Error rejecting company:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.rejectCompany = rejectCompany;
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
const disableCompany = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Company ID' });
        }
        const company = await Company_1.default.findByIdAndUpdate(id, {
            isActive: false,
            status: 'disabled',
            disabledAt: new Date()
        }, { new: true }).select('-password');
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(200).json({ message: 'Company disabled successfully', company });
    }
    catch (error) {
        console.error('Error disabling company:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.disableCompany = disableCompany;
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
const enableCompany = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Company ID' });
        }
        const company = await Company_1.default.findById(id); // Fetch the company to get its current status
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        const updatedCompany = await Company_1.default.findByIdAndUpdate(id, {
            isActive: true,
            status: company.isApproved ? 'approved' : 'pending',
            disabledAt: undefined
        }, { new: true }).select('-password');
        if (!updatedCompany) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(200).json({ message: 'Company enabled successfully', updatedCompany });
    }
    catch (error) {
        console.error('Error enabling company:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.enableCompany = enableCompany;
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
const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Company ID' });
        }
        const company = await Company_1.default.findByIdAndUpdate(id, {
            status: 'deleted',
            isActive: false,
            deletedAt: new Date()
        }, { new: true }).select('-password');
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(200).json({ message: 'Company deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteCompany = deleteCompany;
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
const listAllUsers = async (req, res) => {
    try {
        const users = await User_1.default.find().select('-password');
        res.status(200).json({ message: 'Users retrieved successfully', users });
    }
    catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.listAllUsers = listAllUsers;
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
const getLoggedInAdmin = async (req, res) => {
    try {
        const adminId = req.user?.id;
        if (!adminId) {
            return res.status(403).json({ message: 'Access Denied: No admin ID found in token' });
        }
        const admin = await User_1.default.findById(adminId).select('-password');
        if (!admin || admin.role !== 'superadmin') {
            return res.status(404).json({ message: 'Admin not found' });
        }
        res.status(200).json({ message: 'Admin details retrieved successfully', admin });
    }
    catch (error) {
        console.error('Error getting logged-in admin:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getLoggedInAdmin = getLoggedInAdmin;
/**
 * Get all companies for admin review
 */
const getCompaniesPendingReview = async (req, res) => {
    try {
        const companies = await Company_1.default.find({}).select('-password').sort({ createdAt: -1 });
        res.status(200).json({
            message: 'All companies retrieved successfully',
            companies
        });
    }
    catch (error) {
        console.error('Error getting companies:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getCompaniesPendingReview = getCompaniesPendingReview;
/**
 * Approve a company's completed profile
 */
const approveCompanyProfile = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Company ID' });
        }
        const company = await Company_1.default.findByIdAndUpdate(id, {
            isApproved: true,
            status: 'approved',
            isActive: true,
            profileCompletionStatus: 'complete'
        }, { new: true }).select('-password');
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(200).json({ message: 'Company profile approved successfully', company });
    }
    catch (error) {
        console.error('Error approving company profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.approveCompanyProfile = approveCompanyProfile;
/**
 * Get all employees for admin management
 */
const getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee_1.default.find({}).select('-password').sort({ createdAt: -1 });
        res.status(200).json({
            message: 'All employees retrieved successfully',
            employees
        });
    }
    catch (error) {
        console.error('Error getting employees:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllEmployees = getAllEmployees;
/**
 * Reject a company's completed profile
 */
const rejectCompanyProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Company ID' });
        }
        if (!rejectionReason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }
        const company = await Company_1.default.findByIdAndUpdate(id, {
            isApproved: false,
            status: 'rejected',
            isActive: false,
            rejectionReason,
            profileCompletionStatus: 'incomplete',
            rejectedAt: new Date()
        }, { new: true }).select('-password');
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(200).json({ message: 'Company profile rejected successfully', company });
    }
    catch (error) {
        console.error('Error rejecting company profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.rejectCompanyProfile = rejectCompanyProfile;
