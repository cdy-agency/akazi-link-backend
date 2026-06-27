import { z } from 'zod';
import { otpConfig } from '../config/otp.config';
import type {
  RegisterCandidateBody,
  SendOtpBody,
  VerifyEmailBody,
} from '../types/candidate-auth.types';

const otpCodePattern = new RegExp(`^\\d{${otpConfig.otpLength}}$`);

export const registerCandidateSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(120, 'Full name must be at most 120 characters'),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be at most 128 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const sendOtpSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  code: z
    .string()
    .trim()
    .regex(otpCodePattern, `Code must be exactly ${otpConfig.otpLength} digits`),
});

export type RegisterCandidateInput = z.infer<typeof registerCandidateSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export function parseRegisterCandidateBody(
  input: RegisterCandidateBody
): RegisterCandidateBody {
  return registerCandidateSchema.parse(input);
}

export function parseSendOtpBody(input: SendOtpBody): SendOtpBody {
  return sendOtpSchema.parse(input);
}

export function parseVerifyEmailBody(input: VerifyEmailBody): VerifyEmailBody {
  return verifyEmailSchema.parse(input);
}

export function isValidOtpCodeFormat(code: string): boolean {
  return otpCodePattern.test(code.trim());
}
