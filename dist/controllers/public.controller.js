"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicJobById = exports.listPublicUsers = exports.listPublicJobs = void 0;
const Job_1 = __importDefault(require("../models/Job"));
const User_1 = __importDefault(require("../models/User"));
/**
 * @swagger
 * tags:
 *   name: Public
 *   description: Publicly accessible endpoints
 */
/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: List all jobs (public)
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Optional category to filter jobs
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
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *       500:
 *         description: Server error
 */
const listPublicJobs = async (req, res) => {
    try {
        const { category } = req.query;
        const query = {};
        if (category && typeof category === 'string') {
            query.category = category;
        }
        const jobs = await Job_1.default.find(query)
            .sort({ createdAt: -1 })
            .populate('companyId', 'companyName logo location');
        res.status(200).json({ message: 'Jobs retrieved successfully', jobs });
    }
    catch (error) {
        console.error('Error listing public jobs:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.listPublicJobs = listPublicJobs;
const listPublicUsers = async (req, res) => {
    try {
        const users = await User_1.default.find()
            .select('-password -__v')
            .sort({ createdAt: -1 });
        res.status(200).json({ message: 'Users retrieved successfully', users });
    }
    catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.listPublicUsers = listPublicUsers;
const getPublicJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job_1.default.findById(id)
            .populate('companyId', 'companyName logo location');
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json({ message: 'Job retrieved successfully', job });
    }
    catch (error) {
        console.error('Error getting job:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPublicJobById = getPublicJobById;
