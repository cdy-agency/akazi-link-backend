import { Router } from 'express';
import { registerEmployee, registerCompany, login } from '../controllers/auth.controller';

const router = Router();

/**
* @swagger
* components:
*   schemas:
*     User:
*       type: object
*       properties:
*         _id:
*           type: string
*           description: The auto-generated ID of the user
*           example: 60d5ec49f8c7d00015f8e3b0
*         email:
*           type: string
*           format: email
*           description: User's email address
*           example: user@example.com
*         role:
*           type: string
*           enum: [employee, company, superadmin]
*           description: Role of the user
*           example: employee
*         createdAt:
*           type: string
*           format: date-time
*           description: The date and time the user was created
*         updatedAt:
*           type: string
*           format: date-time
*           description: The date and time the user was last updated
*     Employee:
*       allOf:
*         - $ref: '#/components/schemas/User'
*         - type: object
*           properties:
*             name:
*               type: string
*               description: Employee's full name
*               example: John Doe
*             dateOfBirth:
*               type: string
*               format: date
*               description: Employee's date of birth
*               example: 1990-01-01
*             phoneNumber:
*               type: string
*               description: Employee's phone number
*               example: "+1234567890"
*     Company:
*       allOf:
*         - $ref: '#/components/schemas/User'
*         - type: object
*           properties:
*             companyName:
*               type: string
*               description: Name of the company
*               example: Acme Corp
*             location:
*               type: string
*               description: Company's location
*               example: New York, USA
*             phoneNumber:
*               type: string
*               description: Company's phone number
*               example: "+1987654321"
*             website:
*               type: string
*               description: Company's website URL
*               example: https://www.acmecorp.com
*             logo:
*               type: string
*               description: URL to company logo
*               example: https://www.acmecorp.com/logo.png
*             isApproved:
*               type: boolean
*               description: Whether the company is approved by admin
*               example: false
*     Job:
*       type: object
*       properties:
*         _id:
*           type: string
*           description: The auto-generated ID of the job
*           example: 60d5ec49f8c7d00015f8e3b0
*         title:
*           type: string
*           description: Job title
*           example: Software Engineer
*         description:
*           type: string
*           description: Detailed job description
*           example: We are looking for a skilled software engineer to join our team...
*         skills:
*           type: array
*           items:
*             type: string
*           description: Required skills for the job
*           example: ["Node.js", "React", "MongoDB"]
*         experience:
*           type: string
*           description: Required experience level
*           example: 3+ years
*         employmentType:
*           type: string
*           enum: [fulltime, part-time, internship]
*           description: Type of employment
*           example: fulltime
*         salary:
*           type: string
*           description: Salary range for the job
*           example: $80,000 - $120,000
*         category:
*           type: string
*           description: Job category
*           example: IT & Software
*         companyId:
*           type: string
*           description: ID of the company that posted the job
*           example: 60d5ec49f8c7d00015f8e3b1
*         createdAt:
*           type: string
*           format: date-time
*           description: The date and time the job was posted
*         updatedAt:
*           type: string
*           format: date-time
*           description: The date and time the job was last updated
*     Application:
*       type: object
*       properties:
*         _id:
*           type: string
*           description: The auto-generated ID of the application
*           example: 60d5ec49f8c7d00015f8e3b0
*         jobId:
*           type: string
*           description: ID of the job applied for
*           example: 60d5ec49f8c7d00015f8e3b1
*         employeeId:
*           type: string
*           description: ID of the employee who applied
*           example: 60d5ec49f8c7d00015f8e3b2
*         skills:
*           type: array
*           items:
*             type: string
*           description: Skills provided by the applicant
*           example: ["JavaScript", "React"]
*         experience:
*           type: string
*           description: Experience provided by the applicant
*           example: 5 years in web development
*         appliedVia:
*           type: string
*           enum: [normal, whatsapp, referral]
*           description: How the application was submitted
*           example: normal
*         status:
*           type: string
*           enum: [pending, reviewed, interview, hired, rejected]
*           description: Current status of the application
*           example: pending
*         notifications:
*           type: array
*           items:
*             type: object
*             properties:
*               message:
*                 type: string
*                 example: Your application has been reviewed.
*               read:
*                 type: boolean
*                 example: false
*               createdAt:
*                 type: string
*                 format: date-time
*           description: Notifications related to the application
*         createdAt:
*           type: string
*           format: date-time
*           description: The date and time the application was created
*         updatedAt:
*           type: string
*           format: date-time
*           description: The date and time the application was last updated
*/

/**
 * @swagger
 * /api/auth/register/employee:
 *   post:
 *     summary: Register a new employee
 *     tags: [Authentication]
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
 *               - dateOfBirth
 *               - phoneNumber
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
 *                 minLength: 6
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
 *                 user:
 *                   $ref: '#/components/schemas/Employee'
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Bad request - validation error
 *       409:
 *         description: User already exists
 */
router.post('/register/employee', registerEmployee);

/**
 * @swagger
 * /api/auth/register/company:
 *   post:
 *     summary: Register a new company
 *     tags: [Authentication]
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
 *               - location
 *               - phoneNumber
 *             properties:
 *               companyName:
 *                 type: string
 *                 example: Acme Corp
 *               email:
 *                 type: string
 *                 format: email
 *                 example: contact@acmecorp.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               location:
 *                 type: string
 *                 example: New York, USA
 *               phoneNumber:
 *                 type: string
 *                 example: "+1987654321"
 *               website:
 *                 type: string
 *                 example: https://www.acmecorp.com
 *               logo:
 *                 type: string
 *                 example: https://www.acmecorp.com/logo.png
 *     responses:
 *       201:
 *         description: Company registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company registered successfully. Awaiting admin approval.
 *                 user:
 *                   $ref: '#/components/schemas/Company'
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Bad request - validation error
 *       409:
 *         description: User already exists
 */
router.post('/register/company', registerCompany);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user (employee, company, or superadmin)
 *     tags: [Authentication]
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
 *                 example: user@example.com
 *               password:
 *                 type: string
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
 *                 user:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/Employee'
 *                     - $ref: '#/components/schemas/Company'
 *                     - $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Bad request - missing credentials
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Company not approved by admin
 */
router.post('/login', login);

export default router;
