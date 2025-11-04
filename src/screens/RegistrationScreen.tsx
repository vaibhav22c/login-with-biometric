import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import CustomPicker from '../components/CustomPicker';
import { registrationSchema, getPasswordStrength } from '../utils/validation';
import { RegistrationFormData, Country } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { StorageService } from '../services/storageService';
import countriesData from '../data/countries.json';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Registration'>;

const RegistrationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { register } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, label: '', color: '' });
  const countries: Country[] = countriesData;

  const {
    control,
    handleSubmit,
    formState: { errors, touchedFields, isDirty },
    watch,
    setValue,
  } = useForm<RegistrationFormData>({
    resolver: yupResolver(registrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      country: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  const password = watch('password');

  // Load draft registration data on mount
  useEffect(() => {
    loadDraftData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft registration data
  useEffect(() => {
    if (isDirty) {
      const subscription = watch((data) => {
        StorageService.saveDraftRegistration(data as Partial<RegistrationFormData>);
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, isDirty]);

  // Update password strength
  useEffect(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    } else {
      setPasswordStrength({ strength: 0, label: '', color: '' });
    }
  }, [password]);

  const loadDraftData = async () => {
    const draft = await StorageService.getDraftRegistration();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        const value = draft[key as keyof typeof draft];
        if (value !== undefined && key !== 'password' && key !== 'confirmPassword') {
          setValue(key as keyof RegistrationFormData, value as any);
        }
      });
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    setLoading(true);
    try {
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        country: data.country,
        createdAt: new Date().toISOString(),
      };

      const result = await register(data.email, data.password, userData);

      if (result.success) {
        await StorageService.clearDraftRegistration();
        Alert.alert(
          'Success',
          'Account created successfully! Please login.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Registration failed');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = Object.keys(errors).length === 0;
  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>Create Your Account</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Join us today and get started
        </Text>

        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomInput
              label="First Name *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.firstName?.message}
              touched={touchedFields.firstName}
              placeholder="Enter your first name"
              autoCapitalize="words"
            />
          )}
        />

        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomInput
              label="Last Name *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.lastName?.message}
              touched={touchedFields.lastName}
              placeholder="Enter your last name"
              autoCapitalize="words"
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomInput
              label="Email *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              touched={touchedFields.email}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />

        <Controller
          control={control}
          name="phoneNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomInput
              label="Phone Number *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.phoneNumber?.message}
              touched={touchedFields.phoneNumber}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          )}
        />

        <Controller
          control={control}
          name="country"
          render={({ field: { onChange, value } }) => (
            <CustomPicker
              label="Country *"
              value={value}
              onValueChange={onChange}
              items={countries}
              error={errors.country?.message}
              touched={touchedFields.country}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <CustomInput
                label="Password *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                touched={touchedFields.password}
                placeholder="Enter your password"
                secureTextEntry
              />
              {password && passwordStrength.label && (
                <View style={styles.passwordStrength}>
                  <View style={[styles.strengthBar, { backgroundColor: theme.colors.border }]}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${(passwordStrength.strength / 6) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                    {passwordStrength.label}
                  </Text>
                </View>
              )}
            </>
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomInput
              label="Confirm Password *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              touched={touchedFields.confirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
            />
          )}
        />

        <Controller
          control={control}
          name="agreeToTerms"
          render={({ field: { onChange, value } }) => (
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => onChange(!value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: value }}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    { borderColor: theme.colors.border },
                    value && {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                >
                  {value && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={[styles.checkboxLabel, { color: theme.colors.text }]}>
                  I agree to the Terms and Conditions *
                </Text>
              </TouchableOpacity>
              {touchedFields.agreeToTerms && errors.agreeToTerms && (
                <Text style={[styles.checkboxError, { color: theme.colors.error }]}>
                  {errors.agreeToTerms.message}
                </Text>
              )}
            </View>
          )}
        />

        <CustomButton
          title="Create Account"
          onPress={handleSubmit(onSubmit)}
          disabled={!isFormValid || loading}
          loading={loading}
          style={styles.submitButton}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.loginLink}
        >
          <Text style={[styles.loginLinkText, { color: theme.colors.textSecondary }]}>
            Already have an account?{' '}
            <Text style={[styles.loginLinkBold, { color: theme.colors.primary }]}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (_theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  passwordStrength: {
    marginTop: -8,
    marginBottom: 16,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkboxContainer: {
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxMark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
  },
  checkboxError: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 36,
  },
  submitButton: {
    marginBottom: 16,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginLinkText: {
    fontSize: 14,
  },
  loginLinkBold: {
    fontWeight: '600',
  },
});

export default RegistrationScreen;

