import mongoose from 'mongoose';
import ServiceCategory from '../../models/ServiceCategory';
import Service from '../../models/Service';
import ServiceProvider from '../../models/ServiceProvider';
import ProviderCategory from '../../models/ProviderCategory';
import ProviderService from '../../models/ProviderService';
import {
  generateTemporaryPassword,
  hashPassword,
} from '../../utils/authUtils';
import { uniqueSlug } from '../../utils/slugify';
import { emailService } from '../email/email.service';
import { EmailTemplate } from '../email/email.types';
import ProviderDocument from '../../models/ProviderDocument';
import User from '../../models/User';
import { createProviderNotification } from './marketplace-notification.service';
import { notifyAdminNewProvider } from './marketplace-admin-notification.service';

export type ProviderRegistrationInput = {
  providerType: 'COMPANY' | 'INDIVIDUAL';
  categoryIds: string[];
  serviceIds: string[];
  email: string;
  password?: string;
  phone: string;
  whatsapp?: string;
  description: string;
  yearsOfExperience?: number;
  languages?: string[];
  businessHours?: Array<{ day: string; open: string; close: string; isClosed?: boolean }>;
  province: string;
  district: string;
  sector?: string;
  address?: string;
  displayName: string;
  tin?: string;
  nationalId?: string;
  logo: {
    url: string;
    public_id: string;
    format: string;
    size: number;
    name: string;
    type: string;
    time: string;
  };
  documents?: Array<{ label: string; file: ProviderRegistrationInput['logo'] }>;
  gallery?: ProviderRegistrationInput['logo'][];
  portfolioImages?: ProviderRegistrationInput['logo'][];
  certificates?: ProviderRegistrationInput['logo'][];
};

async function assertCatalogSelections(
  categoryIds: string[],
  serviceIds: string[]
) {
  const categories = await ServiceCategory.find({
    _id: { $in: categoryIds },
    isActive: true,
  }).select('_id');

  if (categories.length !== categoryIds.length) {
    throw Object.assign(new Error('One or more categories are invalid'), {
      statusCode: 400,
    });
  }

  const services = await Service.find({
    _id: { $in: serviceIds },
    categoryId: { $in: categoryIds },
    isActive: true,
  }).select('_id categoryId');

  if (services.length !== serviceIds.length) {
    throw Object.assign(
      new Error('One or more services are invalid for the selected categories'),
      { statusCode: 400 }
    );
  }
}

export async function registerServiceProvider(input: ProviderRegistrationInput) {
  const email = input.email.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
  }

  await assertCatalogSelections(input.categoryIds, input.serviceIds);

  const slug = await uniqueSlug(input.displayName, async (candidate) => {
    const found = await ServiceProvider.findOne({ slug: candidate }).select('_id');
    return Boolean(found);
  });

  const providedPassword = input.password?.trim();
  const plainPassword = providedPassword || generateTemporaryPassword(12);
  const mustChangePassword = !providedPassword;
  const hashedPassword = await hashPassword(plainPassword);

  const provider = await ServiceProvider.create({
    email,
    role: 'service_provider',
    provider: 'EMAIL',
    emailVerified: false,
    isActive: true,
    providerType: input.providerType,
    displayName: input.displayName.trim(),
    slug,
    phone: input.phone,
    whatsapp: input.whatsapp,
    password: hashedPassword,
    mustChangePassword,
    description: input.description,
    yearsOfExperience: input.yearsOfExperience,
    languages: input.languages || [],
    businessHours: input.businessHours || [],
    tin: input.providerType === 'COMPANY' ? input.tin : undefined,
    nationalId: input.providerType === 'INDIVIDUAL' ? input.nationalId : undefined,
    province: input.province,
    district: input.district,
    sector: input.sector,
    address: input.address,
    logo: input.logo,
    gallery: input.gallery || [],
    portfolioImages: input.portfolioImages || [],
    certificates: input.certificates || [],
    status: 'PENDING',
    availabilityStatus: 'AVAILABLE',
    averageRating: 0,
    reviewCount: 0,
  });

  const providerId = provider._id;

  await ProviderCategory.insertMany(
    input.categoryIds.map((categoryId) => ({
      providerId,
      categoryId: new mongoose.Types.ObjectId(categoryId),
    }))
  );

  await ProviderService.insertMany(
    input.serviceIds.map((serviceId) => ({
      providerId,
      serviceId: new mongoose.Types.ObjectId(serviceId),
    }))
  );

  if (input.documents?.length) {
    await ProviderDocument.insertMany(
      input.documents.map((doc) => ({
        providerId,
        label: doc.label,
        file: doc.file,
        uploadedAt: new Date(),
      }))
    );
  }

  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || '';
  const dashboardUrl =
    process.env.FRONTEND_URL_DASHBOARD ||
    (appUrl ? `${appUrl.replace(/\/$/, '')}/dashboard/provider` : '');
  const loginUrl = appUrl ? `${appUrl.replace(/\/$/, '')}/login` : '';

  try {
    await emailService.send({
      to: provider.email,
      template: EmailTemplate.PROVIDER_REGISTRATION_SUBMITTED,
      data: {
        name: provider.displayName,
        providerType: provider.providerType,
        email: provider.email,
        temporaryPassword: plainPassword,
        loginUrl,
        dashboardUrl,
      },
    });
  } catch (error) {
    console.error('Failed to send provider registration submitted email', error);
  }

  try {
    await notifyAdminNewProvider(provider.displayName, provider.email);
  } catch (error) {
    console.error('Failed to notify admin about provider registration', error);
  }

  await createProviderNotification({
    providerId: String(providerId),
    type: 'PROVIDER_REGISTRATION_SUBMITTED',
    title: 'Registration submitted',
    message:
      'Your service provider application has been submitted and is pending review. Check your email for temporary login credentials.',
  });

  return provider;
}
