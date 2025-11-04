import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';

export class BiometricService {
  // Check if biometric authentication is available
  static async isBiometricAvailable(): Promise<boolean> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return biometryType !== null;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  // Get the type of biometric authentication available
  static async getBiometricType(): Promise<string | null> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return biometryType;
    } catch (error) {
      console.error('Error getting biometric type:', error);
      return null;
    }
  }

  // Check if biometric authentication is enabled
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled:', error);
      return false;
    }
  }

  // Enable biometric authentication
  static async enableBiometric(email: string, password: string): Promise<boolean> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        return false;
      }

      // Store credentials with biometric protection
      await Keychain.setGenericPassword(email, password, {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });

      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  }

  // Disable biometric authentication
  static async disableBiometric(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
      return true;
    } catch (error) {
      console.error('Error disabling biometric:', error);
      return false;
    }
  }

  // Authenticate using biometrics
  static async authenticateWithBiometric(): Promise<{
    success: boolean;
    credentials?: { username: string; password: string };
    error?: string;
  }> {
    try {
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return { success: false, error: 'Biometric authentication not enabled' };
      }

      const credentials = await Keychain.getGenericPassword({
        authenticationPrompt: {
          title: 'Authenticate',
          subtitle: 'Use biometrics to login',
          description: 'Place your finger on the sensor or look at the camera',
          cancel: 'Cancel',
        },
      });

      if (credentials) {
        return {
          success: true,
          credentials: {
            username: credentials.username,
            password: credentials.password,
          },
        };
      }

      return { success: false, error: 'Authentication failed' };
    } catch (error: any) {
      console.error('Error authenticating with biometric:', error);
      
      if (error.message === 'User canceled the operation') {
        return { success: false, error: 'Authentication canceled' };
      }

      return { success: false, error: 'Biometric authentication failed' };
    }
  }

  // Get biometric type display name
  static getBiometricDisplayName(type: string | null): string {
    switch (type) {
      case Keychain.BIOMETRY_TYPE.TOUCH_ID:
        return 'Touch ID';
      case Keychain.BIOMETRY_TYPE.FACE_ID:
        return 'Face ID';
      case Keychain.BIOMETRY_TYPE.FINGERPRINT:
        return 'Fingerprint';
      case Keychain.BIOMETRY_TYPE.FACE:
        return 'Face Recognition';
      case Keychain.BIOMETRY_TYPE.IRIS:
        return 'Iris Recognition';
      default:
        return 'Biometric';
    }
  }
}

