import * as Yup from 'yup';

// Email validation schema
export const emailValidation = Yup.string()
  .required('Email is required')
  .email('Invalid email format')
  .matches(
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    'Please enter a valid email address'
  );

// Phone number validation (international format)
export const phoneValidation = Yup.string()
  .required('Phone number is required')
  .matches(
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    'Please enter a valid phone number'
  )
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must not exceed 15 digits');

// Password validation with strength requirements
export const passwordValidation = Yup.string()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

// Registration form validation schema
export const registrationSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'First name can only contain letters'),
  lastName: Yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Last name can only contain letters'),
  email: emailValidation,
  phoneNumber: phoneValidation,
  country: Yup.string()
    .required('Country is required')
    .min(2, 'Please select a valid country'),
  password: passwordValidation,
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
  agreeToTerms: Yup.boolean()
    .required('You must agree to the terms and conditions')
    .oneOf([true], 'You must agree to the terms and conditions'),
});

// Login form validation schema
export const loginSchema = Yup.object().shape({
  emailOrUsername: Yup.string()
    .required('Email or username is required')
    .min(3, 'Must be at least 3 characters'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

// Password strength calculator
export const getPasswordStrength = (password: string): {
  strength: number;
  label: string;
  color: string;
} => {
  let strength = 0;
  
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[@$!%*?&]/.test(password)) strength += 1;
  
  if (strength <= 2) return { strength, label: 'Weak', color: '#ff4444' };
  if (strength <= 4) return { strength, label: 'Medium', color: '#ffbb33' };
  return { strength, label: 'Strong', color: '#00C851' };
};

