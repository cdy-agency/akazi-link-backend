"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const User_1 = __importDefault(require("./User")); // Import the base User model
const FileInfoSchema = new mongoose_1.Schema({
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    format: { type: String, required: true },
    size: { type: Number, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    time: { type: String, required: true }
});
const CompanySchema = new mongoose_1.Schema({
    companyName: { type: String, required: true },
    location: { type: String },
    phoneNumber: { type: String },
    website: { type: String },
    logo: { type: FileInfoSchema },
    isApproved: { type: Boolean, default: false },
    password: { type: String, require: true },
    about: { type: String },
    documents: { type: [FileInfoSchema], default: [] },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'disabled', 'deleted'],
        default: 'pending'
    },
    isActive: { type: Boolean, default: true },
    rejectionReason: { type: String },
    disabledAt: { type: Date },
    deletedAt: { type: Date },
    profileCompletionStatus: {
        type: String,
        enum: ['incomplete', 'complete', 'pending_review'],
        default: 'incomplete'
    },
    profileCompletedAt: { type: Date },
}, { timestamps: true });
// Extend the User model with Company-specific fields
const Company = User_1.default.discriminator('Company', CompanySchema);
exports.default = Company;
