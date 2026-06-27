import dotenv from 'dotenv';

dotenv.config();

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  name: string
): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name}: must be a positive integer`);
  }

  return parsed;
}

const expirationMinutes = parsePositiveInt(
  process.env.OTP_EXPIRATION_MINUTES,
  5,
  'OTP_EXPIRATION_MINUTES'
);

const maxResendAttempts = parsePositiveInt(
  process.env.OTP_MAX_RESEND_ATTEMPTS,
  3,
  'OTP_MAX_RESEND_ATTEMPTS'
);

const resendCooldownMinutes = parsePositiveInt(
  process.env.OTP_RESEND_COOLDOWN_MINUTES,
  15,
  'OTP_RESEND_COOLDOWN_MINUTES'
);

const maxVerifyAttempts = parsePositiveInt(
  process.env.OTP_MAX_VERIFY_ATTEMPTS,
  5,
  'OTP_MAX_VERIFY_ATTEMPTS'
);

const otpLength = parsePositiveInt(process.env.OTP_LENGTH, 6, 'OTP_LENGTH');

export const otpConfig = {
  expirationMinutes,
  expirationMs: expirationMinutes * 60 * 1000,
  maxResendAttempts,
  resendCooldownMinutes,
  resendCooldownMs: resendCooldownMinutes * 60 * 1000,
  maxVerifyAttempts,
  otpLength,
} as const;

export type OtpConfig = typeof otpConfig;
