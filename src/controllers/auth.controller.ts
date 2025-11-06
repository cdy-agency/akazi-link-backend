import { Request, Response } from 'express';
import { hashPassword, comparePasswords, generateToken } from '../utils/authUtils';
import Employee from '../models/Employee';
import Company from '../models/Company';
import User from '../models/User';
import { parseSingleFile } from '../services/fileUploadService';
import { sendEmail } from '../utils/sendEmail';
import AdminNotification from '../models/AdminNotification';

export const registerEmployee = async (req: Request, res: Response) => {
try {
  const { name, email, password, dateOfBirth, phoneNumber, jobPreferences,province, district,gender } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const hashedPassword = await hashPassword(password);

  const employee = await Employee.create({
    name,
    email,
    password: hashedPassword,
    role: 'employee',
    dateOfBirth,
    province, 
    district,
    gender,
    phoneNumber,
    jobPreferences: Array.isArray(jobPreferences) ? jobPreferences : [],
  });

  console.log('this is employee information', employee)

  try {
      await sendEmail({
        type: 'employeeRegistration',
        to: process.env.SMTP_USER || '',
        data: {
          employeeName: name,
          email,
          phoneNumber,
        },
      });
    } catch (error) {
      console.error('Failed to notify admin about employee registration', error);
    }

  // Create admin system notification
  try {
    await AdminNotification.create({
      message: `New employee registered: ${name} (${email})`,
      read: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to create admin system notification for employee registration', error);
  }

  
  res.status(201).json({ message: 'Employee registered successfully', employee: employee.toJSON() });
} catch (error) {
  console.error('Error registering employee:', error);
  res.status(500).json({ message: 'Server error during employee registration' });
}
};

export const registerCompany = async (req: Request, res: Response) => {
try {
  const { companyName, email, password, district, province, phoneNumber, website } = req.body as any;
  const logo = parseSingleFile((req.body as any).logo);

  if (!companyName || !email || !password) {
    return res.status(400).json({ message: 'Please provide company name, email, and password' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const hashedPassword = await hashPassword(password);

  const company = await Company.create({
    companyName,
    email,
    password: hashedPassword,
    role: 'company',
    district,
    province,
    phoneNumber,
    website,
    ...(logo ? { logo } : {}),
    isApproved: false, 
    status: 'pending',
    isActive: true,
  });

  
  try {
    await sendEmail({
      type:'companyRegistration',
      to: process.env.SMTP_USER || '',
      data:{
        companyName,
        email,
        district,
        province,
        website,
        phoneNumber,
        logo: logo?.url
      }
    })
  } catch (error) {
    console.log('Failed to notify admin about company registration', error)
  }

  // Create admin system notification
  try {
    await AdminNotification.create({
      message: `New company registered: ${companyName} (${email})`,
      read: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to create admin system notification for company registration', error);
  }
  
  res.status(201).json({ message: 'Company registered successfully. Awaiting admin approval.', company: company.toJSON() });
} catch (error) {
  console.error('Error registering company:', error);
  res.status(500).json({ message: 'Server error during company registration' });
}
};

export const login = async (req: Request, res: Response) => {
try {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const isMatch = await comparePasswords(password, user.password!);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  let responsePayload: { id: string; role: string; isApproved?: boolean } = {
    id: (user._id as any).toString(),
    role: user.role,
  };

  if (user.role === 'company') {
    const company = await Company.findById(user._id as any);
    if (!company) {
      return res.status(400).json({ message: 'Company profile not found' });
    }
    responsePayload.isApproved = company.isApproved;
  }

  const token = generateToken(responsePayload);

  res.status(200).json({
    message: 'Login successful',
    token,
    role: user.role,
    ...(user.role === 'company' && { isApproved: responsePayload.isApproved }),
  });
} catch (error) {
  res.status(500).json({ message: 'Server error during login' });
}
};

/**
 * Allow a logged-in company (even if not approved) to submit missing profile info
 * Expects: about (string), documents (string[] or string)
 */
export const companyCompleteProfile = async (req: Request, res: Response) => {
  try {
    const { id, role } = (req as any).user || {};
    if (!id || role !== 'company') {
      return res.status(403).json({ message: 'Access Denied' });
    }

    const { about, documents } = req.body as { about?: string; documents?: string[] | string };
    const updates: any = {};
    if (typeof about === 'string') updates.about = about;
    if (documents) updates.documents = Array.isArray(documents) ? documents : [documents];

    const company = await Company.findByIdAndUpdate(id, { $set: updates }, { new: true }).select('-password');
    if (!company) return res.status(404).json({ message: 'Company not found' });

    try {
      await sendEmail({
        type:'companyProfileCompletedNotify',
        to:process.env.SMTP_USER || '',
        data: {
          companyName:company.companyName,
          dashboardLink:`${process.env.FRONTEND_URL_DASHBOARD}/admin`,
          logo: company.logo?.url
        }
      })
    } catch (error) {
      console.log("Failed send email about profile", error)
    }
    // Create admin system notification
    try {
      await AdminNotification.create({
        message: `Company profile completed: ${company.companyName}`,
        read: false,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to create admin system notification for company profile completion', error);
    }
    res.status(200).json({ message: 'Details submitted', company });
    console.log('company updated profile', company) 
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
