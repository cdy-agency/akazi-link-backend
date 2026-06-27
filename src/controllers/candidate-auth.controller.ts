import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { hashPassword, generateToken } from '../utils/authUtils';
import { emailService } from '../services/email/email.service';
import { EmailTemplate, LegacyEmailTemplate } from '../services/email/email.types';
import Employee from '../models/Employee';
import User from '../models/User';
import AdminNotification from '../models/AdminNotification';
import { otpConfig } from '../config/otp.config';
import {
  issueOtp,
  normalizeEmail,
  verifyOtpForEmail,
} from '../services/otp.service';
import {
  registerCandidateSchema,
  sendOtpSchema,
  verifyEmailSchema,
} from '../validators/candidate-auth.validator';
import {
  CandidateAuthError,
  type AuthErrorCode,
  type AuthErrorResponse,
  type RegisterCandidateResponse,
  type SendOtpResponse,
  type VerifiedUserPayload,
  type VerifyEmailResponse,
} from '../types/candidate-auth.types';
import type { IEmployee } from '../types/models';

const GENERIC_OTP_SENT_MESSAGE =
  'If this email is registered and pending verification, a code was sent.';

function sendAuthError(
  res: Response,
  statusCode: number,
  code: AuthErrorCode,
  message: string,
  extras?: Partial<Pick<AuthErrorResponse, 'requiresVerification' | 'email'>>
): Response {
  const body: AuthErrorResponse = { message, code, ...extras };
  return res.status(statusCode).json(body);
}

function validationErrorResponse(res: Response, error: ZodError): Response {
  const message = error.issues[0]?.message ?? 'Validation failed';
  return sendAuthError(res, 400, 'VALIDATION_ERROR', message);
}

async function sendVerificationOtpEmail(
  to: string,
  code: string
): Promise<void> {
  await emailService.send({
    to,
    template: EmailTemplate.OTP,
    data: {
      otp: code,
      expirationMinutes: otpConfig.expirationMinutes,
      platformName: process.env.APP_NAME || 'Imihigo',
      accentColor: '#0866ff',
    },
  });
}

function toVerifiedUserPayload(employee: IEmployee): VerifiedUserPayload {
  return {
    id: String(employee._id),
    email: employee.email,
    role: 'employee',
    name: employee.name,
    emailVerified: true,
  };
}

function isDuplicateKeyError(error: object): boolean {
  return 'code' in error && (error as { code: number }).code === 11000;
}

export const registerCandidate = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const parsed = registerCandidateSchema.safeParse(req.body);
  if (!parsed.success) {
    return validationErrorResponse(res, parsed.error);
  }

  const { fullName, email, password } = parsed.data;
  const normalizedEmail = normalizeEmail(email);

  try {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendAuthError(
        res,
        409,
        'EMAIL_ALREADY_REGISTERED',
        'Email already registered'
      );
    }

    const hashedPassword = await hashPassword(password);

    const employee = await Employee.create({
      name: fullName,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'employee',
      provider: 'EMAIL',
      emailVerified: false,
      emailVerifiedAt: null,
    });

    const { plainCode } = await issueOtp(normalizedEmail);

    try {
      await sendVerificationOtpEmail(normalizedEmail, plainCode);
    } catch (emailError) {
      console.error('Failed to send verification OTP email:', emailError);
      return sendAuthError(
        res,
        500,
        'REGISTRATION_FAILED',
        'Registration could not be completed. Please try again.'
      );
    }

    try {
      await emailService.send({
        to: process.env.SMTP_USER || '',
        template: LegacyEmailTemplate.ADMIN_CANDIDATE_REGISTRATION,
        data: {
          employeeName: fullName,
          email: normalizedEmail,
        },
      });
    } catch (adminEmailError) {
      console.error(
        'Failed to notify admin about candidate registration:',
        adminEmailError
      );
    }

    try {
      await AdminNotification.create({
        message: `New candidate registered: ${fullName} (${normalizedEmail})`,
        read: false,
        createdAt: new Date(),
      });
    } catch (notificationError) {
      console.error(
        'Failed to create admin notification for candidate registration:',
        notificationError
      );
    }

    const response: RegisterCandidateResponse = {
      message: 'Registration successful. Please verify your email.',
      requiresVerification: true,
      email: normalizedEmail,
      userId: String(employee._id),
    };

    return res.status(201).json(response);
  } catch (error) {
    if (isDuplicateKeyError(error as object)) {
      return sendAuthError(
        res,
        409,
        'EMAIL_ALREADY_REGISTERED',
        'Email already registered'
      );
    }

    console.error('Error registering candidate:', error);
    return sendAuthError(
      res,
      500,
      'REGISTRATION_FAILED',
      'Server error during candidate registration'
    );
  }
};

export const sendOtp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const parsed = sendOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return validationErrorResponse(res, parsed.error);
  }

  const normalizedEmail = normalizeEmail(parsed.data.email);
  const genericResponse: SendOtpResponse = {
    message: GENERIC_OTP_SENT_MESSAGE,
    expiresInSeconds: otpConfig.expirationMinutes * 60,
  };

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.emailVerified) {
      return res.status(200).json(genericResponse);
    }

    const { plainCode } = await issueOtp(normalizedEmail);

    try {
      await sendVerificationOtpEmail(normalizedEmail, plainCode);
    } catch (emailError) {
      console.error('Failed to resend verification OTP email:', emailError);
      return sendAuthError(
        res,
        500,
        'REGISTRATION_FAILED',
        'Could not send verification code. Please try again later.'
      );
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    if (error instanceof CandidateAuthError) {
      return sendAuthError(res, error.statusCode, error.code, error.message);
    }

    console.error('Error sending OTP:', error);
    return sendAuthError(
      res,
      500,
      'REGISTRATION_FAILED',
      'Server error while sending verification code'
    );
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const parsed = verifyEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    return validationErrorResponse(res, parsed.error);
  }

  const { email, code } = parsed.data;
  const normalizedEmail = normalizeEmail(email);

  try {
    const employee = await Employee.findOne({ email: normalizedEmail });

    if (!employee) {
      return sendAuthError(
        res,
        404,
        'USER_NOT_FOUND',
        'No account found for this email'
      );
    }

    if (employee.emailVerified) {
      return sendAuthError(
        res,
        400,
        'ALREADY_VERIFIED',
        'Email is already verified'
      );
    }

    await verifyOtpForEmail(normalizedEmail, code);

    employee.emailVerified = true;
    employee.emailVerifiedAt = new Date();
    await employee.save();

    const token = generateToken({
      id: String(employee._id),
      role: employee.role,
    });

    const response: VerifyEmailResponse = {
      message: 'Email verified successfully',
      token,
      user: toVerifiedUserPayload(employee),
    };

    return res.status(200).json(response);
  } catch (error) {
    if (error instanceof CandidateAuthError) {
      return sendAuthError(res, error.statusCode, error.code, error.message);
    }

    console.error('Error verifying email:', error);
    return sendAuthError(
      res,
      500,
      'REGISTRATION_FAILED',
      'Server error during email verification'
    );
  }
};
