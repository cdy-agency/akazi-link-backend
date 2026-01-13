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
import { sendEmail } from "../utils/sendEmail";
import AdminNotification from "../models/AdminNotification";
import { verifyGoogleToken } from "../utils/googleAuth";
import { signToken } from "../utils/jwt";

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
      await sendEmail({
        type: "employeeRegistration",
        to: process.env.SMTP_USER || "",
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

export const registerCompany = async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      email,
      password,
      district,
      province,
      phoneNumber,
      website,
    } = req.body as any;
    const logo = parseSingleFile((req.body as any).logo);

    if (!companyName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide company name, email, and password" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await hashPassword(password);

    const company = await Company.create({
      companyName,
      email,
      password: hashedPassword,
      role: "company",
      district,
      province,
      phoneNumber,
      website,
      ...(logo ? { logo } : {}),
      isApproved: false,
      status: "pending",
      isActive: true,
    });

    try {
      await sendEmail({
        type: "companyRegistration",
        to: process.env.SMTP_USER || "",
        data: {
          companyName,
          email,
          district,
          province,
          website,
          phoneNumber,
          logo: logo?.url,
        },
      });
    } catch (error) {
      console.log("Failed to notify admin about company registration", error);
    }

    // Create admin system notification
    try {
      await AdminNotification.create({
        message: `New company registered: ${companyName} (${email})`,
        read: false,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error(
        "Failed to create admin system notification for company registration",
        error
      );
    }

    const companyObj = company.toObject();
    res.status(201).json({
      message: "Company registered successfully. Awaiting admin approval.",
      company: companyObj,
    });
  } catch (error) {
    console.error("Error registering company:", error);
    res
      .status(500)
      .json({ message: "Server error during company registration" });
  }
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

    const isMatch = await comparePasswords(password, user.password!);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    let responsePayload: { id: string; role: string; isApproved?: boolean } = {
      id: (user._id as any).toString(),
      role: user.role,
    };

    if (user.role === "company") {
      const company = await Company.findById(user._id as any);
      if (!company) {
        return res.status(400).json({ message: "Company profile not found" });
      }
      responsePayload.isApproved = company.isApproved;
    }

    const token = generateToken(responsePayload);

    res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
      ...(user.role === "company" && {
        isApproved: responsePayload.isApproved,
      }),
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
    if (employee || company) {
      const existingUser = employee || company;
      console.log("✅ Found existing user with role:", existingUser?.role);

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
          ...(existingUser?.role === "company" && {
            isApproved: (existingUser as any).isApproved,
          }),
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
    res.status(500).json({ message: "Server error during Google login" });
  }
};

export const setRole = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { role } = req.body;

    console.log("🎯 Setting role for user:", userId, "to", role);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!role || !["employee", "company"].includes(role))
      return res.status(400).json({ message: "Invalid role" });

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
        { _id: user._id },
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
      
    } else if (role === "company") {
      console.log("🏢 Converting to Company...");
      
      // Directly update the database document
      await User.collection.updateOne(
        { _id: user._id },
        {
          $set: {
            __t: "Company",
            role: "company",
            companyName: nameFromEmail,
            phoneNumber: "",
            isActive: true,
            isApproved: false,
            status: "pending",
            profileImage: (user as any).profileImage,
          }
        }
      );

      // Fetch as Company
      userData = await Company.findById(userId);
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
        name: role === "employee" ? userData.name : userData.companyName,
        ...(role === "company" && { isApproved: userData.isApproved }),
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
