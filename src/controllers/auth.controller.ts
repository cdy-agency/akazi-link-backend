import { Request, Response } from "express";
import {
  hashPassword,
  comparePasswords,
  generateToken,
} from "../utils/authUtils";
import Employee from "../models/Employee";
import Company from "../models/Company";
import User from "../models/User";
import { parseSingleFile } from "../services/fileUploadService";
import { emailService } from "../services/email/email.service";
import { LegacyEmailTemplate } from "../services/email/email.types";
import AdminNotification from "../models/AdminNotification";
import { verifyGoogleToken } from "../utils/googleAuth";
import { signToken } from "../utils/jwt";
import { Types } from "mongoose";
import { isAuthV2LoginGateEnabled } from "../config/auth-v2.config";

const LEGACY_COMPANY_MESSAGE =
  "Company accounts are no longer supported. Please use the candidate registration flow or contact the platform administrator.";

export const registerEmployee = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      dateOfBirth,
      phoneNumber,
      jobPreferences,
      province,
      district,
      gender,
    } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email, and password" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await hashPassword(password);

    const employee = await Employee.create({
      name,
      email,
      password: hashedPassword,
      role: "employee",
      dateOfBirth,
      province,
      district,
      gender,
      phoneNumber,
      jobPreferences: Array.isArray(jobPreferences) ? jobPreferences : [],
    });

    try {
      await emailService.send({
        to: process.env.SMTP_USER || "",
        template: LegacyEmailTemplate.ADMIN_CANDIDATE_REGISTRATION,
        data: {
          employeeName: name,
          email,
          phoneNumber,
        },
      });
    } catch (error) {
      console.error(
        "Failed to notify admin about employee registration",
        error
      );
    }

    // Create admin system notification
    try {
      await AdminNotification.create({
        message: `New employee registered: ${name} (${email})`,
        read: false,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error(
        "Failed to create admin system notification for employee registration",
        error
      );
    }

    const employeeObj = employee.toObject();
    res.status(201).json({
      message: "Employee registered successfully",
      employee: employeeObj,
    });
  } catch (error) {
    console.error("Error registering employee:", error);
    res
      .status(500)
      .json({ message: "Server error during employee registration" });
  }
};

export const registerCompany = async (_req: Request, res: Response) => {
  return res.status(410).json({
    message: LEGACY_COMPANY_MESSAGE,
    code: "LEGACY_FEATURE_REMOVED",
  });
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.role === "company") {
      return res.status(410).json({
        message: LEGACY_COMPANY_MESSAGE,
        code: "LEGACY_FEATURE_REMOVED",
      });
    }

    const isMatch = await comparePasswords(password, user.password!);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (isAuthV2LoginGateEnabled()) {
      if (user.isActive === false) {
        return res.status(403).json({
          message: "Account is deactivated.",
          code: "ACCOUNT_DEACTIVATED",
        });
      }

      if (user.role === "employee" && user.emailVerified !== true) {
        return res.status(403).json({
          message: "Please verify your email before logging in.",
          code: "EMAIL_NOT_VERIFIED",
          requiresVerification: true,
          email: user.email,
        });
      }
    }

    if (String(user.role) === "company") {
      return res.status(410).json({
        message: LEGACY_COMPANY_MESSAGE,
        code: "LEGACY_FEATURE_REMOVED",
      });
    }

    let responsePayload: { id: string; role: string } = {
      id: String(user._id),
      role: user.role,
    };

    const token = generateToken(responsePayload);

    res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token)
      return res.status(400).json({ message: "Google token is required" });

    const payload = await verifyGoogleToken(token);

    if (!payload?.email)
      return res.status(401).json({ message: "Invalid Google token" });

    console.log("🔍 Google login attempt for:", payload.email);

    // Check if user exists in any collection (User, Employee, or Company)
    let employee = await Employee.findOne({ email: payload.email });
    let company = await Company.findOne({ email: payload.email });

    // Existing Employee or Company
    if (company && !employee) {
      return res.status(410).json({
        message: LEGACY_COMPANY_MESSAGE,
        code: "LEGACY_FEATURE_REMOVED",
      });
    }

    if (employee) {
      const existingUser = employee;
      // Link Google account if not already linked
      if (!existingUser?.provider || existingUser?.provider !== "GOOGLE") {
        existingUser!.provider = "GOOGLE";
        // Use type assertion to access profileImage
        (existingUser as any).profileImage = payload.picture || (existingUser as any).profileImage;
        await existingUser?.save();
        console.log("🔗 Linked Google account to existing user");
      }

      // Generate token and return
      const jwtToken = signToken({
        id: existingUser!._id,
        role: existingUser!.role,
      });

      return res.status(200).json({
        message: "Login successful",
        token: jwtToken,
        user: {
          id: existingUser?._id,
          email: existingUser?.email,
          profileImage: (existingUser as any).profileImage,
          role: existingUser?.role,
        },
      });
    }

    // New Google user - Create base user and require role selection
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      console.log("➕ Creating new Google user (needs role selection)");

      user = await User.create({
        email: payload.email,
        profileImage: payload.picture,
        provider: "GOOGLE",
        role: null,
        isActive: true,
      });

      console.log("✅ New user created with ID:", user._id);
    } else if (!user.provider || user.provider !== "GOOGLE") {
      // Existing base user without Google link
      console.log("🔗 Linking Google to existing base user");
      user.provider = "GOOGLE";
      (user as any).profileImage = payload.picture || (user as any).profileImage;
      await user.save();
    }

    // User exists but has no role - needs role selection
    const jwtToken = signToken({ id: user._id, role: user.role });

    return res.status(200).json({
      message: "Please select your role to continue",
      token: jwtToken,
      needsRoleSelection: true,
      user: {
        id: user._id,
        email: user.email,
        profileImage: (user as any).profileImage,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Google login error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error during Google login" });
    }
  }
};

export const setRole = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { role } = req.body;

    console.log("🎯 Setting role for user:", userId, "to", role);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!role || role !== "employee") {
      return res.status(410).json({
        message: LEGACY_COMPANY_MESSAGE,
        code: "LEGACY_FEATURE_REMOVED",
      });
    }

    // Find the base user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already has a role
    if (user.role && user.role !== null) {
      return res.status(400).json({ message: "User already has a role" });
    }

    const nameFromEmail = user.email?.split('@')[0] || "User";

    let userData: any;

    if (role === "employee") {
      console.log("👤 Converting to Employee...");
      
      // Directly update the database document
      await User.collection.updateOne(
        { _id: new Types.ObjectId(String(user._id)) },
        {
          $set: {
            __t: "Employee",
            role: "employee",
            name: nameFromEmail,
            phoneNumber: "",
            jobPreferences: [],
            isActive: true,
            profileImage: (user as any).profileImage,
          }
        }
      );

      // Fetch as Employee
      userData = await Employee.findById(userId);
    }

    if (!userData) {
      return res.status(500).json({ message: "Failed to set role" });
    }

    const jwtToken = signToken({ id: userData._id, role: userData.role });

    res.status(200).json({
      message: "Role set successfully",
      token: jwtToken,
      user: {
        id: userData._id,
        email: userData.email,
        profileImage: userData.profileImage,
        role: userData.role,
        name: userData.name,
      },
    });
  } catch (err: any) {
    console.error("❌ Error setting role:", err);
    res.status(500).json({ 
      message: "Server error while setting role",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId || !role)
      return res.status(401).json({ message: "Unauthorized" });

    let userData: any;

    switch (role) {
      case "employee":
        userData = await Employee.findById(userId).select("-password");
        if (!userData) {
          return res.status(404).json({
            message: "Employee profile not found",
          });
        }
        break;

      case "company":
        userData = await Company.findById(userId).select("-password");
        if (!userData) {
          return res.status(404).json({
            message: "Company profile not found",
          });
        }
        break;

      case "superadmin":
        userData = await User.findById(userId).select("-password");
        break;

      default:
        return res.status(400).json({ message: "Invalid role" });
    }

    if (!userData) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      user: userData?.toObject(),
    });
  } catch (err) {
    console.error("getCurrentUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
