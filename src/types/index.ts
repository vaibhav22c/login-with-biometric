export interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface LoginFormData {
  emailOrUsername: string;
  password: string;
}

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  failedLoginAttempts: number;
  isLockedOut: boolean;
  lockoutUntil: number | null;
}

export interface Country {
  code: string;
  name: string;
  phoneCode: string;
}

