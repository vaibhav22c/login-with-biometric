import {
  emailValidation,
  phoneValidation,
  passwordValidation,
  registrationSchema,
  loginSchema,
  getPasswordStrength,
} from '../validation';

describe('Validation Utils', () => {
  describe('Email Validation', () => {
    it('should validate correct email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.com',
      ];

      for (const email of validEmails) {
        await expect(emailValidation.validate(email)).resolves.toBe(email);
      }
    });

    it('should reject invalid email formats', async () => {
      const invalidEmails = ['invalid', 'test@', '@example.com', 'test@.com'];

      for (const email of invalidEmails) {
        await expect(emailValidation.validate(email)).rejects.toThrow();
      }
    });

    it('should reject empty email', async () => {
      await expect(emailValidation.validate('')).rejects.toThrow('Email is required');
    });
  });

  describe('Phone Validation', () => {
    it('should validate correct phone formats', async () => {
      const validPhones = ['+1234567890', '1234567890'];

      for (const phone of validPhones) {
        await expect(phoneValidation.validate(phone)).resolves.toBe(phone);
      }
    });

    it('should reject phone numbers that are too short', async () => {
      await expect(phoneValidation.validate('123')).rejects.toThrow();
    });

    it('should reject phone numbers that are too long', async () => {
      await expect(phoneValidation.validate('12345678901234567890')).rejects.toThrow();
    });

    it('should reject empty phone number', async () => {
      await expect(phoneValidation.validate('')).rejects.toThrow('Phone number is required');
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', async () => {
      const strongPasswords = ['Test@1234', 'SecureP@ss123', 'MyP@ssw0rd!'];

      for (const password of strongPasswords) {
        await expect(passwordValidation.validate(password)).resolves.toBe(password);
      }
    });

    it('should reject passwords without uppercase letters', async () => {
      await expect(passwordValidation.validate('test@1234')).rejects.toThrow();
    });

    it('should reject passwords without lowercase letters', async () => {
      await expect(passwordValidation.validate('TEST@1234')).rejects.toThrow();
    });

    it('should reject passwords without numbers', async () => {
      await expect(passwordValidation.validate('Test@Test')).rejects.toThrow();
    });

    it('should reject passwords without special characters', async () => {
      await expect(passwordValidation.validate('Test1234')).rejects.toThrow();
    });

    it('should reject passwords that are too short', async () => {
      await expect(passwordValidation.validate('Ts@1')).rejects.toThrow();
    });

    it('should reject empty password', async () => {
      await expect(passwordValidation.validate('')).rejects.toThrow('Password is required');
    });
  });

  describe('Registration Schema', () => {
    const validRegistrationData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+1234567890',
      country: 'US',
      password: 'SecureP@ss123',
      confirmPassword: 'SecureP@ss123',
      agreeToTerms: true,
    };

    it('should validate correct registration data', async () => {
      await expect(registrationSchema.validate(validRegistrationData)).resolves.toEqual(
        validRegistrationData
      );
    });

    it('should reject when passwords do not match', async () => {
      const data = {
        ...validRegistrationData,
        confirmPassword: 'DifferentP@ss123',
      };
      await expect(registrationSchema.validate(data)).rejects.toThrow('Passwords must match');
    });

    it('should reject when terms are not agreed', async () => {
      const data = {
        ...validRegistrationData,
        agreeToTerms: false,
      };
      await expect(registrationSchema.validate(data)).rejects.toThrow();
    });

    it('should reject invalid first name with numbers', async () => {
      const data = {
        ...validRegistrationData,
        firstName: 'John123',
      };
      await expect(registrationSchema.validate(data)).rejects.toThrow();
    });

    it('should reject invalid last name with numbers', async () => {
      const data = {
        ...validRegistrationData,
        lastName: 'Doe456',
      };
      await expect(registrationSchema.validate(data)).rejects.toThrow();
    });
  });

  describe('Login Schema', () => {
    const validLoginData = {
      emailOrUsername: 'john@example.com',
      password: 'password123',
    };

    it('should validate correct login data', async () => {
      await expect(loginSchema.validate(validLoginData)).resolves.toEqual(validLoginData);
    });

    it('should reject empty email/username', async () => {
      const data = {
        ...validLoginData,
        emailOrUsername: '',
      };
      await expect(loginSchema.validate(data)).rejects.toThrow();
    });

    it('should reject empty password', async () => {
      const data = {
        ...validLoginData,
        password: '',
      };
      await expect(loginSchema.validate(data)).rejects.toThrow();
    });

    it('should reject too short email/username', async () => {
      const data = {
        ...validLoginData,
        emailOrUsername: 'ab',
      };
      await expect(loginSchema.validate(data)).rejects.toThrow();
    });
  });

  describe('Password Strength', () => {
    it('should return weak for short password', () => {
      const result = getPasswordStrength('abc');
      expect(result.label).toBe('Weak');
      expect(result.color).toBe('#ff4444');
    });

    it('should return medium for moderate password', () => {
      const result = getPasswordStrength('Abcd1234');
      expect(result.label).toBe('Medium');
      expect(result.color).toBe('#ffbb33');
    });

    it('should return strong for complex password', () => {
      const result = getPasswordStrength('Abcd@1234567');
      expect(result.label).toBe('Strong');
      expect(result.color).toBe('#00C851');
    });

    it('should return weak for empty password', () => {
      const result = getPasswordStrength('');
      expect(result.label).toBe('Weak');
    });
  });
});

