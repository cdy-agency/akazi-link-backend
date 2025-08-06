import dotenv from 'dotenv';
import User from '../models/User';
import { hashPassword } from './authUtils';

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
    console.log('Default SuperAdmin user seeded successfully.');
  } else {
    console.log('SuperAdmin user already exists.');
  }
} catch (error) {
  console.error('Error seeding SuperAdmin user:', error);
}
};
