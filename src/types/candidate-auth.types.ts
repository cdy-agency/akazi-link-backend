export type AuthErrorCode =
  | 'VALIDATION_ERROR'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'EMAIL_NOT_VERIFIED'
  | 'OTP_INVALID'
  | 'OTP_INVALID_FORMAT'
  | 'OTP_EXPIRED'
  | 'OTP_MAX_ATTEMPTS'
  | 'OTP_RATE_LIMITED'
  | 'ALREADY_VERIFIED'
  | 'USER_NOT_FOUND'
  | 'REGISTRATION_FAILED';

export interface RegisterCandidateBody {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SendOtpBody {
  email: string;
}

export interface VerifyEmailBody {
  email: string;
  code: string;
}

export interface RegisterCandidateResponse {
  message: string;
  requiresVerification: true;
  email: string;
  userId: string;
}

export interface SendOtpResponse {
  message: string;
  expiresInSeconds: number;
}

export interface VerifiedUserPayload {
  id: string;
  email: string;
  role: 'employee';
  name: string;
  emailVerified: true;
}

export interface VerifyEmailResponse {
  message: string;
  token: string;
  user: VerifiedUserPayload;
}

export interface AuthErrorResponse {
  message: string;
  code: AuthErrorCode;
  requiresVerification?: boolean;
  email?: string;
}

export interface IssueOtpResult {
  plainCode: string;
  expiresInSeconds: number;
  expiresAt: Date;
}

export class CandidateAuthError extends Error {
  readonly code: AuthErrorCode;

  readonly statusCode: number;

  constructor(code: AuthErrorCode, message: string, statusCode: number) {
    super(message);
    this.name = 'CandidateAuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}
