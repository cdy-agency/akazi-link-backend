import { randomInt } from 'crypto';
import { comparePasswords, hashPassword } from '../utils/authUtils';
import EmailOtp from '../models/EmailOtp';
import { otpConfig } from '../config/otp.config';
import { isValidOtpCodeFormat } from '../validators/candidate-auth.validator';
import {
  CandidateAuthError,
  type IssueOtpResult,
} from '../types/candidate-auth.types';
import type { IEmailOtp } from '../types/models';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateNumericOtp(): string {
  let code = '';
  for (let i = 0; i < otpConfig.otpLength; i += 1) {
    code += String(randomInt(0, 10));
  }
  return code;
}

export async function hashOtpCode(code: string): Promise<string> {
  return hashPassword(code);
}

export async function verifyOtpCode(
  code: string,
  otpHash: string
): Promise<boolean> {
  return comparePasswords(code, otpHash);
}

export async function assertResendAllowed(email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const windowStart = new Date(Date.now() - otpConfig.resendCooldownMs);

  const recentCount = await EmailOtp.countDocuments({
    email: normalizedEmail,
    createdAt: { $gte: windowStart },
  });

  if (recentCount >= otpConfig.maxResendAttempts) {
    throw new CandidateAuthError(
      'OTP_RATE_LIMITED',
      'Too many verification codes requested. Please try again later.',
      429
    );
  }
}

export async function issueOtp(email: string): Promise<IssueOtpResult> {
  const normalizedEmail = normalizeEmail(email);

  await assertResendAllowed(normalizedEmail);

  const plainCode = generateNumericOtp();
  const otpHash = await hashOtpCode(plainCode);
  const expiresAt = new Date(Date.now() + otpConfig.expirationMs);

  await EmailOtp.create({
    email: normalizedEmail,
    otpHash,
    expiresAt,
    attempts: 0,
    createdAt: new Date(),
  });

  return {
    plainCode,
    expiresInSeconds: otpConfig.expirationMinutes * 60,
    expiresAt,
  };
}

export async function findLatestActiveOtp(
  email: string
): Promise<IEmailOtp | null> {
  const normalizedEmail = normalizeEmail(email);
  const now = new Date();

  return EmailOtp.findOne({
    email: normalizedEmail,
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .exec();
}

export async function incrementOtpAttempts(otpRecord: IEmailOtp): Promise<void> {
  otpRecord.attempts += 1;
  await otpRecord.save();
}

export async function consumeOtpRecord(otpRecord: IEmailOtp): Promise<void> {
  await EmailOtp.deleteOne({ _id: otpRecord._id });
}

export async function verifyOtpForEmail(
  email: string,
  code: string
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const trimmedCode = code.trim();

  if (!isValidOtpCodeFormat(trimmedCode)) {
    throw new CandidateAuthError(
      'OTP_INVALID_FORMAT',
      `Verification code must be exactly ${otpConfig.otpLength} digits.`,
      400
    );
  }

  const otpRecord = await findLatestActiveOtp(normalizedEmail);

  if (!otpRecord) {
    throw new CandidateAuthError(
      'OTP_EXPIRED',
      'Verification code has expired. Please request a new code.',
      400
    );
  }

  if (otpRecord.attempts >= otpConfig.maxVerifyAttempts) {
    throw new CandidateAuthError(
      'OTP_MAX_ATTEMPTS',
      'Maximum verification attempts exceeded. Please request a new code.',
      400
    );
  }

  const isMatch = await verifyOtpCode(trimmedCode, otpRecord.otpHash);

  if (!isMatch) {
    await incrementOtpAttempts(otpRecord);

    const attemptsRemaining =
      otpConfig.maxVerifyAttempts - otpRecord.attempts;

    if (attemptsRemaining <= 0) {
      throw new CandidateAuthError(
        'OTP_MAX_ATTEMPTS',
        'Maximum verification attempts exceeded. Please request a new code.',
        400
      );
    }

    throw new CandidateAuthError(
      'OTP_INVALID',
      'Invalid verification code.',
      400
    );
  }

  await consumeOtpRecord(otpRecord);
}
