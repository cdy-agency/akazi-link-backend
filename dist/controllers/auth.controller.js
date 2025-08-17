"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyCompleteProfile = exports.login = exports.registerCompany = exports.registerEmployee = void 0;
const authUtils_1 = require("../utils/authUtils");
const Employee_1 = __importDefault(require("../models/Employee"));
const Company_1 = __importDefault(require("../models/Company"));
const User_1 = __importDefault(require("../models/User"));
/**
* @swagger
* tags:
*   name: Auth
*   description: User authentication and registration
*/
/**
* @swagger
* /api/auth/register/employee:
*   post:
*     summary: Register a new employee
*     tags: [Auth]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - name
*               - email
*               - password
*             properties:
*               name:
*                 type: string
*                 example: John Doe
*               email:
*                 type: string
*                 format: email
*                 example: john.doe@example.com
*               password:
*                 type: string
*                 format: password
*                 example: password123
*               dateOfBirth:
*                 type: string
*                 format: date
*                 example: 1990-01-01
*               phoneNumber:
*                 type: string
*                 example: "+1234567890"
*     responses:
*       201:
*         description: Employee registered successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Employee registered successfully
*                 employee:
*                   $ref: '#/components/schemas/Employee'
*       400:
*         description: Bad request (e.g., email already exists, missing fields)
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Email already registered
*       500:
*         description: Server error
*/
const registerEmployee = async (req, res) => {
    try {
        const { name, email, password, dateOfBirth, phoneNumber, jobPreferences } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        const hashedPassword = await (0, authUtils_1.hashPassword)(password);
        const employee = await Employee_1.default.create({
            name,
            email,
            password: hashedPassword,
            role: 'employee',
            dateOfBirth,
            phoneNumber,
            jobPreferences: Array.isArray(jobPreferences) ? jobPreferences : [],
        });
        res.status(201).json({ message: 'Employee registered successfully', employee: employee.toJSON() });
    }
    catch (error) {
        console.error('Error registering employee:', error);
        res.status(500).json({ message: 'Server error during employee registration' });
    }
};
exports.registerEmployee = registerEmployee;
/**
* @swagger
* /api/auth/register/company:
*   post:
*     summary: Register a new company
*     tags: [Auth]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - companyName
*               - email
*               - password
*             properties:
*               companyName:
*                 type: string
*                 example: Tech Solutions Inc.
*               email:
*                 type: string
*                 format: email
*                 example: contact@techsolutions.com
*               password:
*                 type: string
*                 format: password
*                 example: companyPass123
*               location:
*                 type: string
*                 example: New York, USA
*               phoneNumber:
*                 type: string
*                 example: "+1987654321"
*               website:
*                 type: string
*                 example: https://www.techsolutions.com
*               logo:
*                 type: string
*                 example: https://example.com/logo.png
*     responses:
*       201:
*         description: Company registered successfully (awaiting admin approval)
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Company registered successfully. Awaiting admin approval.
*                 company:
*                   $ref: '#/components/schemas/Company'
*       400:
*         description: Bad request (e.g., email already exists, missing fields)
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Email already registered
*       500:
*         description: Server error
*/
const registerCompany = async (req, res) => {
    try {
        const { companyName, email, password, location, phoneNumber, website, logo } = req.body;
        if (!companyName || !email || !password) {
            return res.status(400).json({ message: 'Please provide company name, email, and password' });
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        const hashedPassword = await (0, authUtils_1.hashPassword)(password);
        const company = await Company_1.default.create({
            companyName,
            email,
            password: hashedPassword,
            role: 'company',
            location,
            phoneNumber,
            website,
            // Store full file info object when provided by rod-fileupload middleware.
            // If a legacy string URL is provided, skip setting logo to avoid schema cast errors.
            ...(logo && typeof logo === 'object' ? { logo } : {}),
            isApproved: false,
            status: 'pending',
            isActive: true,
        });
        res.status(201).json({ message: 'Company registered successfully. Awaiting admin approval.', company: company.toJSON() });
    }
    catch (error) {
        console.error('Error registering company:', error);
        res.status(500).json({ message: 'Server error during company registration' });
    }
};
exports.registerCompany = registerCompany;
/**
* @swagger
* /api/auth/login:
*   post:
*     summary: Log in a user (Employee, Company, or SuperAdmin)
*     tags: [Auth]
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
*                 example: john.doe@example.com
*               password:
*                 type: string
*                 format: password
*                 example: password123
*     responses:
*       200:
*         description: Login successful
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Login successful
*                 token:
*                   type: string
*                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
*                 role:
*                   type: string
*                   example: employee
*                 isApproved:
*                   type: boolean
*                   description: Only for company role, indicates if company is approved
*                   example: true
*       400:
*         description: Invalid credentials or company not approved
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*                   example: Invalid credentials
*       500:
*         description: Server error
*/
const login = async (req, res) => {
    try {
        console.log('Login attempt for email:', req.body.email);
        const { email, password } = req.body;
        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ message: 'Please provide email and password' });
        }
        const user = await User_1.default.findOne({ email });
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        console.log('User found, role:', user.role);
        const isMatch = await (0, authUtils_1.comparePasswords)(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        let responsePayload = {
            id: user._id.toString(),
            role: user.role,
        };
        if (user.role === 'company') {
            const company = await Company_1.default.findById(user._id);
            if (!company) {
                console.log('Company profile not found for user:', email);
                return res.status(400).json({ message: 'Company profile not found' });
            }
            responsePayload.isApproved = company.isApproved;
            console.log('Company approval status:', company.isApproved);
        }
        const token = (0, authUtils_1.generateToken)(responsePayload);
        console.log('Token generated successfully for user:', email);
        res.status(200).json({
            message: 'Login successful',
            token,
            role: user.role,
            ...(user.role === 'company' && { isApproved: responsePayload.isApproved }),
        });
    }
    catch (error) {
        console.error('Login error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            email: req.body?.email
        });
        res.status(500).json({ message: 'Server error during login' });
    }
};
exports.login = login;
/**
 * Allow a logged-in company (even if not approved) to submit missing profile info
 * Expects: about (string), documents (string[] or string)
 */
const companyCompleteProfile = async (req, res) => {
    try {
        const { id, role } = req.user || {};
        if (!id || role !== 'company') {
            return res.status(403).json({ message: 'Access Denied' });
        }
        const { about, documents } = req.body;
        const updates = {};
        if (typeof about === 'string')
            updates.about = about;
        if (documents)
            updates.documents = Array.isArray(documents) ? documents : [documents];
        const company = await Company_1.default.findByIdAndUpdate(id, { $set: updates }, { new: true }).select('-password');
        if (!company)
            return res.status(404).json({ message: 'Company not found' });
        res.status(200).json({ message: 'Details submitted', company });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.companyCompleteProfile = companyCompleteProfile;
