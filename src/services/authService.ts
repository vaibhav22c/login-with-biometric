import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '../types';

const AUTH_STATE_KEY = '@auth_state';
const REGISTERED_USERS_KEY = '@registered_users';

export class AuthService {
  // Store user credentials securely in Keychain
  static async storeCredentials(
    email: string,
    password: string
  ): Promise<boolean> {
    try {
      await Keychain.setGenericPassword(email, password);
      return true;
    } catch (error) {
      console.error('Error storing credentials:', error);
      return false;
    }
  }

  // Retrieve stored credentials
  static async getStoredCredentials(): Promise<{
    username: string;
    password: string;
  } | null> {
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        return {
          username: credentials.username,
          password: credentials.password,
        };
      }
      return null;
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      return null;
    }
  }

  // Clear stored credentials
  static async clearCredentials(): Promise<boolean> {
    try {
      await Keychain.resetGenericPassword();
      return true;
    } catch (error) {
      console.error('Error clearing credentials:', error);
      return false;
    }
  }

  // Store user data (non-sensitive)
  static async storeUserData(user: User): Promise<boolean> {
    try {
      await AsyncStorage.setItem(`@user_${user.email}`, JSON.stringify(user));
      
      // Also add to registered users list
      const registeredUsers = await this.getRegisteredUsers();
      if (!registeredUsers.includes(user.email)) {
        registeredUsers.push(user.email);
        await AsyncStorage.setItem(
          REGISTERED_USERS_KEY,
          JSON.stringify(registeredUsers)
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  }

  // Get user data
  static async getUserData(email: string): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(`@user_${email}`);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  // Get list of registered users
  static async getRegisteredUsers(): Promise<string[]> {
    try {
      const users = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error retrieving registered users:', error);
      return [];
    }
  }

  // Store auth state
  static async storeAuthState(authState: AuthState): Promise<boolean> {
    try {
      await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify(authState));
      return true;
    } catch (error) {
      console.error('Error storing auth state:', error);
      return false;
    }
  }

  // Get auth state
  static async getAuthState(): Promise<AuthState | null> {
    try {
      const authState = await AsyncStorage.getItem(AUTH_STATE_KEY);
      return authState ? JSON.parse(authState) : null;
    } catch (error) {
      console.error('Error retrieving auth state:', error);
      return null;
    }
  }

  // Clear auth state
  static async clearAuthState(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(AUTH_STATE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing auth state:', error);
      return false;
    }
  }

  // Verify credentials
  static async verifyCredentials(
    email: string,
    password: string
  ): Promise<boolean> {
    try {
      // Try to get user-specific credentials
      const credentials = await this.getUserCredentials(email);
      if (!credentials) {
        // Fallback to old method for backward compatibility
        const oldCredentials = await this.getStoredCredentials();
        if (oldCredentials && oldCredentials.username === email) {
          return oldCredentials.password === password;
        }
        return false;
      }
      
      return credentials.email === email && credentials.password === password;
    } catch (error) {
      console.error('Error verifying credentials:', error);
      return false;
    }
  }

  // Register new user
  static async register(
    email: string,
    password: string,
    userData: User
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user already exists
      const existingUsers = await this.getRegisteredUsers();
      if (existingUsers.includes(email)) {
        return { success: false, error: 'User already exists' };
      }

      // Store user data first
      const userDataStored = await this.storeUserData(userData);
      if (!userDataStored) {
        return { success: false, error: 'Failed to store user data' };
      }

      // Store credentials with user email as key
      const credentialsStored = await this.storeUserCredentials(email, password);
      if (!credentialsStored) {
        return { success: false, error: 'Failed to store credentials' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error during registration:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  // Store user-specific credentials
  static async storeUserCredentials(
    email: string,
    password: string
  ): Promise<boolean> {
    try {
      await AsyncStorage.setItem(`@credentials_${email}`, JSON.stringify({ email, password }));
      return true;
    } catch (error) {
      console.error('Error storing user credentials:', error);
      return false;
    }
  }

  // Get user-specific credentials
  static async getUserCredentials(email: string): Promise<{
    email: string;
    password: string;
  } | null> {
    try {
      const credentials = await AsyncStorage.getItem(`@credentials_${email}`);
      return credentials ? JSON.parse(credentials) : null;
    } catch (error) {
      console.error('Error retrieving user credentials:', error);
      return null;
    }
  }

  // Login user
  static async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Get current auth state
      const authState = await this.getAuthState();
      
      // Check if locked out
      if (authState?.isLockedOut && authState?.lockoutUntil) {
        const now = Date.now();
        if (now < authState.lockoutUntil) {
          const remainingMinutes = Math.ceil((authState.lockoutUntil - now) / 60000);
          return {
            success: false,
            error: `Account locked. Try again in ${remainingMinutes} minute(s)`,
          };
        }
      }

      // Verify credentials
      const isValid = await this.verifyCredentials(email, password);
      
      if (!isValid) {
        // Increment failed attempts
        const failedAttempts = (authState?.failedLoginAttempts || 0) + 1;
        const isLockedOut = failedAttempts >= 5;
        const lockoutUntil = isLockedOut ? Date.now() + 15 * 60 * 1000 : null; // 15 minutes

        await this.storeAuthState({
          isAuthenticated: false,
          user: null,
          failedLoginAttempts: failedAttempts,
          isLockedOut,
          lockoutUntil,
        });

        return {
          success: false,
          error: isLockedOut
            ? 'Too many failed attempts. Account locked for 15 minutes'
            : `Invalid credentials. ${5 - failedAttempts} attempt(s) remaining`,
        };
      }

      // Get user data
      const user = await this.getUserData(email);
      if (!user) {
        return { success: false, error: 'User data not found' };
      }

      // Store auth state
      await this.storeAuthState({
        isAuthenticated: true,
        user,
        failedLoginAttempts: 0,
        isLockedOut: false,
        lockoutUntil: null,
      });

      return { success: true, user };
    } catch (error) {
      console.error('Error during login:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  // Logout user
  static async logout(): Promise<boolean> {
    try {
      // Clear auth state but keep credentials so user can login again
      await this.clearAuthState();
      // Note: We don't clear credentials here because the user should be able to login again
      // Credentials are only cleared when explicitly needed (e.g., account deletion)
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<{ authenticated: boolean; user?: User }> {
    try {
      const authState = await this.getAuthState();
      if (authState?.isAuthenticated && authState?.user) {
        return { authenticated: true, user: authState.user };
      }
      return { authenticated: false };
    } catch (error) {
      console.error('Error checking authentication:', error);
      return { authenticated: false };
    }
  }
}

