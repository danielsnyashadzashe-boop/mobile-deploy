import { z } from 'zod';

// Sign-up validation schema
export const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username is too long'),
  emailAddress: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

// Sign-in validation schema
export const signInSchema = z.object({
  emailAddress: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Email verification code schema
export const verificationCodeSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d+$/, 'Code must contain only numbers'),
});

// TypeScript types inferred from schemas
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type VerificationCodeInput = z.infer<typeof verificationCodeSchema>;
