import AsyncStorage from '@react-native-async-storage/async-storage';
import { RegistrationFormData } from '../types';

const DRAFT_REGISTRATION_KEY = '@draft_registration';

export class StorageService {
  // Save draft registration data
  static async saveDraftRegistration(
    data: Partial<RegistrationFormData>
  ): Promise<boolean> {
    try {
      const dataToSave = {
        ...data,
        password: undefined, // Never persist passwords
        confirmPassword: undefined,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(
        DRAFT_REGISTRATION_KEY,
        JSON.stringify(dataToSave)
      );
      return true;
    } catch (error) {
      console.error('Error saving draft registration:', error);
      return false;
    }
  }

  // Get draft registration data
  static async getDraftRegistration(): Promise<Partial<RegistrationFormData> | null> {
    try {
      const data = await AsyncStorage.getItem(DRAFT_REGISTRATION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving draft registration:', error);
      return null;
    }
  }

  // Clear draft registration data
  static async clearDraftRegistration(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(DRAFT_REGISTRATION_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing draft registration:', error);
      return false;
    }
  }
}

