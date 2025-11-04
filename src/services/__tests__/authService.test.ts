import { AuthService } from '../authService';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the native modules
jest.mock('react-native-keychain');
jest.mock('@react-native-async-storage/async-storage');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset AsyncStorage mock
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('storeCredentials', () => {
    it('should store credentials successfully', async () => {
      (Keychain.setGenericPassword as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.storeCredentials('test@example.com', 'password123');
      
      expect(result).toBe(true);
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should return false on error', async () => {
      (Keychain.setGenericPassword as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await AuthService.storeCredentials('test@example.com', 'password123');
      
      expect(result).toBe(false);
    });
  });

  describe('getStoredCredentials', () => {
    it('should retrieve stored credentials', async () => {
      const mockCredentials = {
        username: 'test@example.com',
        password: 'password123',
      };
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(mockCredentials);

      const result = await AuthService.getStoredCredentials();
      
      expect(result).toEqual(mockCredentials);
    });

    it('should return null when no credentials are stored', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

      const result = await AuthService.getStoredCredentials();
      
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockRejectedValue(new Error('Retrieval error'));

      const result = await AuthService.getStoredCredentials();
      
      expect(result).toBeNull();
    });
  });

  describe('clearCredentials', () => {
    it('should clear credentials successfully', async () => {
      (Keychain.resetGenericPassword as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.clearCredentials();
      
      expect(result).toBe(true);
      expect(Keychain.resetGenericPassword).toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      (Keychain.resetGenericPassword as jest.Mock).mockRejectedValue(new Error('Clear error'));

      const result = await AuthService.clearCredentials();
      
      expect(result).toBe(false);
    });
  });

  describe('register', () => {
    const mockUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
      country: 'US',
      createdAt: new Date().toISOString(),
    };

    it('should register a new user successfully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));
      (Keychain.setGenericPassword as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.register('john@example.com', 'password123', mockUserData);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject registration if user already exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(['john@example.com'])
      );

      const result = await AuthService.register('john@example.com', 'password123', mockUserData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User already exists');
    });

    it('should handle credential storage failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string) => {
        if (key.startsWith('@credentials_')) {
          return Promise.reject(new Error('Storage error'));
        }
        return Promise.resolve();
      });

      const result = await AuthService.register('john@example.com', 'password123', mockUserData);
      
      expect(result.success).toBe(false);
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const mockAuthState = {
        isAuthenticated: false,
        user: null,
        failedLoginAttempts: 0,
        isLockedOut: false,
        lockoutUntil: null,
      };
      const mockUser = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        country: 'US',
        createdAt: new Date().toISOString(),
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === '@auth_state') {
          return Promise.resolve(JSON.stringify(mockAuthState));
        }
        if (key === '@user_john@example.com') {
          return Promise.resolve(JSON.stringify(mockUser));
        }
        if (key === '@credentials_john@example.com') {
          return Promise.resolve(JSON.stringify({
            email: 'john@example.com',
            password: 'password123',
          }));
        }
        return Promise.resolve(null);
      });

      const result = await AuthService.login('john@example.com', 'password123');
      
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should reject login with incorrect credentials', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === '@auth_state') {
          return Promise.resolve(JSON.stringify({
            isAuthenticated: false,
            user: null,
            failedLoginAttempts: 0,
            isLockedOut: false,
            lockoutUntil: null,
          }));
        }
        if (key === '@credentials_john@example.com') {
          return Promise.resolve(JSON.stringify({
            email: 'john@example.com',
            password: 'password123',
          }));
        }
        return Promise.resolve(null);
      });

      const result = await AuthService.login('john@example.com', 'wrongpassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid credentials');
    });

    it('should lockout after 5 failed attempts', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === '@auth_state') {
          return Promise.resolve(JSON.stringify({
            isAuthenticated: false,
            user: null,
            failedLoginAttempts: 4,
            isLockedOut: false,
            lockoutUntil: null,
          }));
        }
        if (key === '@credentials_john@example.com') {
          return Promise.resolve(JSON.stringify({
            email: 'john@example.com',
            password: 'password123',
          }));
        }
        return Promise.resolve(null);
      });

      const result = await AuthService.login('john@example.com', 'wrongpassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Account locked');
    });

    it('should prevent login when account is locked', async () => {
      const futureTime = Date.now() + 10 * 60 * 1000; // 10 minutes in future
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({
          isAuthenticated: false,
          user: null,
          failedLoginAttempts: 5,
          isLockedOut: true,
          lockoutUntil: futureTime,
        })
      );

      const result = await AuthService.login('john@example.com', 'password123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Account locked');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const result = await AuthService.logout();
      
      expect(result).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@auth_state');
      // Note: Credentials are NOT cleared during logout so users can login again
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      const mockUser = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        country: 'US',
        createdAt: new Date().toISOString(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({
          isAuthenticated: true,
          user: mockUser,
          failedLoginAttempts: 0,
          isLockedOut: false,
          lockoutUntil: null,
        })
      );

      const result = await AuthService.isAuthenticated();
      
      expect(result.authenticated).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should return false when user is not authenticated', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({
          isAuthenticated: false,
          user: null,
          failedLoginAttempts: 0,
          isLockedOut: false,
          lockoutUntil: null,
        })
      );

      const result = await AuthService.isAuthenticated();
      
      expect(result.authenticated).toBe(false);
      expect(result.user).toBeUndefined();
    });
  });
});

