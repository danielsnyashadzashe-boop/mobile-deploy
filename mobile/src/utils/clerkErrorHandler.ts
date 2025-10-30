import { ClerkAPIError } from '@clerk/types';

export interface ClerkError {
  status?: number;
  clerkError?: boolean;
  errors?: ClerkAPIError[];
}

// Extract the main error message from Clerk error object
export const getClerkErrorMessage = (error: any): string => {
  if (!error) return 'An unexpected error occurred';

  // Handle Clerk API errors
  if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    const clerkError = error.errors[0];

    // Return long message if available, otherwise short message
    return clerkError.longMessage || clerkError.message || 'Authentication error occurred';
  }

  // Handle standard errors
  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

// Extract error code from Clerk error
export const getClerkErrorCode = (error: any): string | null => {
  if (error?.errors?.[0]?.code) {
    return error.errors[0].code;
  }
  return null;
};

// Type guard to check if error is from Clerk
export const isClerkError = (error: any): error is ClerkError => {
  return error?.clerkError === true || (error?.errors && Array.isArray(error.errors));
};

// Map of Clerk error codes to user-friendly messages
export const clerkErrorMessages: Record<string, string> = {
  // Sign-in errors
  'form_identifier_not_found': 'No account found with this email address. Please sign up first.',
  'form_password_incorrect': 'Incorrect password. Please try again.',

  // Sign-up errors
  'form_identifier_exists': 'An account with this email already exists. Please sign in instead.',
  'email_address_exists': 'This email is already registered. Please sign in or use a different email.',
  'form_password_pwned': 'This password has been found in a data breach. Please use a stronger password.',
  'form_password_length_too_short': 'Password is too short. Please use at least 8 characters.',
  'form_password_validation_failed': 'Password does not meet requirements. Use 8+ characters with uppercase, lowercase, number, and special character.',

  // Verification errors
  'verification_already_verified': 'This email has already been verified.',
  'form_code_incorrect': 'Incorrect verification code. Please check and try again.',

  // CAPTCHA errors
  'captcha_invalid': 'CAPTCHA verification failed. Please refresh and try again.',

  // General validation errors
  'form_param_format_invalid': 'Invalid format. Please check your input.',
  'form_param_nil': 'Please fill in all required fields.',

  // Session errors
  'session_exists': 'You are already signed in.',
  'identifier_already_signed_in': 'You are already signed in with this account.',
};

// Get user-friendly error message based on error code
export const getFriendlyErrorMessage = (error: any): string => {
  const errorCode = getClerkErrorCode(error);

  if (errorCode && clerkErrorMessages[errorCode]) {
    return clerkErrorMessages[errorCode];
  }

  return getClerkErrorMessage(error);
};
