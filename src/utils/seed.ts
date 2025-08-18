import dotenv from 'dotenv';
import User from '../models/User';
import { hashPassword } from './authUtils';
import Company from '../models/Company';

dotenv.config();

export const seedSuperAdmin = async () => {
const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'admin@joblink.com';
const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'admin123';

try {
  const existingAdmin = await User.findOne({ email: superAdminEmail, role: 'superadmin' });

  if (!existingAdmin) {
    const hashedPassword = await hashPassword(superAdminPassword);
    await User.create({
      email: superAdminEmail,
      password: hashedPassword,
      role: 'superadmin',
    });
  } else {
  }
} catch (error) {
  console.error('Error seeding SuperAdmin user:', error);
}
};

export const migrateCompanyStatus = async () => {
  try {    
    // Update companies without status field to have 'pending' status
    const result = await Company.updateMany(
      { status: { $exists: false } },
      { 
        $set: { 
          status: 'pending',
          isActive: true
        }
      }
    );
    
    // Update companies without isApproved to have isApproved: false
    await Company.updateMany(
      { isApproved: { $exists: false } },
      { $set: { isApproved: false } }
    );
    
    // Update companies without isActive to have isActive: true
    await Company.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );
    
  } catch (error) {
    console.error('Error during company status migration:', error);
  }
};
