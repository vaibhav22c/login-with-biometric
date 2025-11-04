import { StorageService } from '../storageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveDraftRegistration', () => {
    it('should save draft registration without sensitive data', async () => {
      const draftData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'ShouldNotBeSaved',
        confirmPassword: 'ShouldNotBeSaved',
        country: 'US',
      };

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await StorageService.saveDraftRegistration(draftData);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      
      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      );
      
      expect(savedData.password).toBeUndefined();
      expect(savedData.confirmPassword).toBeUndefined();
      expect(savedData.firstName).toBe('John');
      expect(savedData.email).toBe('john@example.com');
    });

    it('should return false on error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await StorageService.saveDraftRegistration({ firstName: 'John' });

      expect(result).toBe(false);
    });
  });

  describe('getDraftRegistration', () => {
    it('should retrieve saved draft registration', async () => {
      const mockDraft = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        lastUpdated: new Date().toISOString(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockDraft));

      const result = await StorageService.getDraftRegistration();

      expect(result).toEqual(mockDraft);
    });

    it('should return null when no draft exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await StorageService.getDraftRegistration();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Retrieval error'));

      const result = await StorageService.getDraftRegistration();

      expect(result).toBeNull();
    });
  });

  describe('clearDraftRegistration', () => {
    it('should clear draft registration', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const result = await StorageService.clearDraftRegistration();

      expect(result).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@draft_registration');
    });

    it('should return false on error', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Clear error'));

      const result = await StorageService.clearDraftRegistration();

      expect(result).toBe(false);
    });
  });
});

