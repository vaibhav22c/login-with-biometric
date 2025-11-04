import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { BiometricService } from '../services/biometricService';
import CustomButton from '../components/CustomButton';
import countriesData from '../data/countries.json';
import { Country } from '../types';

const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const countries: Country[] = countriesData;

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await BiometricService.isBiometricAvailable();
    const type = await BiometricService.getBiometricType();
    const enabled = await BiometricService.isBiometricEnabled();
    
    setBiometricAvailable(available);
    setBiometricType(type);
    setBiometricEnabled(enabled);
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // Enable biometric
      if (user?.email) {
        Alert.alert(
          'Enable Biometric',
          `Enable ${BiometricService.getBiometricDisplayName(biometricType)} for quick login?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enable',
              onPress: async () => {
                // For demo, we'll use a placeholder password
                // In production, you'd prompt for password or use existing session
                const result = await BiometricService.enableBiometric(user.email, 'stored_password');
                if (result) {
                  setBiometricEnabled(true);
                  Alert.alert('Success', 'Biometric authentication enabled');
                } else {
                  Alert.alert('Error', 'Failed to enable biometric authentication');
                }
              },
            },
          ]
        );
      }
    } else {
      // Disable biometric
      const result = await BiometricService.disableBiometric();
      if (result) {
        setBiometricEnabled(false);
      }
    }
  };

  const handleThemeToggle = (value: boolean) => {
    setThemeMode(value ? 'dark' : 'light');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await logout();
            setLoading(false);
          },
        },
      ]
    );
  };

  const getCountryName = (countryCode: string): string => {
    const country = countries.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const styles = createStyles(theme);

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          No user data available
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.avatarText}>
            {user.firstName[0]}
            {user.lastName[0]}
          </Text>
        </View>
        <Text style={[styles.greeting, { color: theme.colors.text }]}>
          Hello, {user.firstName} {user.lastName}!
        </Text>
        <Text style={[styles.subGreeting, { color: theme.colors.textSecondary }]}>
          Welcome to your profile
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Personal Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Full Name</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {user.firstName} {user.lastName}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Email</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user.email}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Phone Number</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user.phoneNumber}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Country</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {getCountryName(user.country)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Member Since</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{formatDate(user.createdAt)}</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Settings</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Text style={[styles.settingIcon]}>🌙</Text>
            <View>
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Dark Mode</Text>
              <Text style={[styles.settingSubtext, { color: theme.colors.textSecondary }]}>
                {themeMode === 'auto' ? 'System' : themeMode === 'dark' ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>
          <Switch
            value={themeMode === 'dark'}
            onValueChange={handleThemeToggle}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {biometricAvailable && (
          <>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={[styles.settingIcon]}>
                  {biometricType === 'FaceID' || biometricType === 'Face' ? '👤' : '👆'}
                </Text>
                <View>
                  <Text style={[styles.settingText, { color: theme.colors.text }]}>
                    {BiometricService.getBiometricDisplayName(biometricType)}
                  </Text>
                  <Text style={[styles.settingSubtext, { color: theme.colors.textSecondary }]}>
                    {biometricEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </>
        )}

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Info', 'Edit profile feature coming soon!')}
        >
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>✏️ Edit Profile</Text>
          <Text style={[styles.actionArrow, { color: theme.colors.border }]}>›</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Info', 'Privacy feature coming soon!')}
        >
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>🔒 Privacy</Text>
          <Text style={[styles.actionArrow, { color: theme.colors.border }]}>›</Text>
        </TouchableOpacity>
      </View>

      <CustomButton
        title="Logout"
        onPress={handleLogout}
        loading={loading}
        variant="secondary"
        style={styles.logoutButton}
      />

      <Text style={[styles.version, { color: theme.colors.textSecondary }]}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const createStyles = (_theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 16,
  },
  actionArrow: {
    fontSize: 24,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default HomeScreen;

