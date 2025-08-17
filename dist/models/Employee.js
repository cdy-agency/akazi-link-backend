"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const User_1 = __importDefault(require("./User"));
const EmployeeSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    dateOfBirth: { type: Date },
    phoneNumber: { type: String },
    image: { type: String },
    jobPreferences: { type: [String], default: [] },
    about: { type: String },
    experience: { type: String },
    education: { type: String },
    profileImage: { type: String },
    skills: { type: [String], default: [] },
    documents: { type: [String], default: [] },
}, { timestamps: true });
// Extend the User model with Employee-specific fields
const Employee = User_1.default.discriminator('Employee', EmployeeSchema);
exports.default = Employee;
