"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSuperAdmin = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../models/User"));
const authUtils_1 = require("./authUtils");
dotenv_1.default.config();
const seedSuperAdmin = async () => {
    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'admin@joblink.com';
    const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'admin123';
    try {
        const existingAdmin = await User_1.default.findOne({ email: superAdminEmail, role: 'superadmin' });
        if (!existingAdmin) {
            const hashedPassword = await (0, authUtils_1.hashPassword)(superAdminPassword);
            await User_1.default.create({
                email: superAdminEmail,
                password: hashedPassword,
                role: 'superadmin',
            });
            console.log('Default SuperAdmin user seeded successfully.');
        }
        else {
            console.log('SuperAdmin user already exists.');
        }
    }
    catch (error) {
        console.error('Error seeding SuperAdmin user:', error);
    }
};
exports.seedSuperAdmin = seedSuperAdmin;
