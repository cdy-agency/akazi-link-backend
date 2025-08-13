"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const User_1 = __importDefault(require("./User")); // Import the base User model
const CompanySchema = new mongoose_1.Schema({
    companyName: { type: String, required: true },
    location: { type: String },
    phoneNumber: { type: String },
    website: { type: String },
    logo: { type: String },
    isApproved: { type: Boolean, default: false },
    password: { type: String, require: true },
    about: { type: String },
    documents: { type: [String], default: [] },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'disabled', 'deleted'],
        default: 'pending'
    },
    isActive: { type: Boolean, default: true },
    rejectionReason: { type: String },
    disabledAt: { type: Date },
    deletedAt: { type: Date },
}, { timestamps: true });
// Extend the User model with Company-specific fields
const Company = User_1.default.discriminator('Company', CompanySchema);
exports.default = Company;
