import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

type Props = NativeStackScreenProps<any, 'Signup'>;

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { signup } = useAuth();

  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fname?: string;
    lname?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const newErrors: any = {};

    if (!fname.trim()) {
      newErrors.fname = 'First name is required';
    }

    if (!lname.trim()) {
      newErrors.lname = 'Last name is required';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signup(fname, lname, email, password);
    } catch (error: any) {
      Alert.alert('Signup Failed', error.response?.data?.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 32,
    },
    formContainer: {
      marginBottom: 24,
    },
    nameRow: {
      flexDirection: 'row',
      gap: 12,
    },
    nameInput: {
      flex: 1,
    },
    loginLink: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
    },
    loginText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    loginLinkText: {
      color: theme.button,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
          <View style={styles.scrollContent}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us today</Text>

            <View style={styles.formContainer}>
              <View style={styles.nameRow}>
                <Input
                  label="First Name"
                  placeholder="First name"
                  value={fname}
                  onChangeText={setFname}
                  error={errors.fname}
                  style={styles.nameInput}
                />
                <Input
                  label="Last Name"
                  placeholder="Last name"
                  value={lname}
                  onChangeText={setLname}
                  error={errors.lname}
                  style={styles.nameInput}
                />
              </View>

              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                error={errors.email}
              />

              <Input
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                error={errors.password}
              />

              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                error={errors.confirmPassword}
              />
            </View>

            <Button title="Create Account" onPress={handleSignup} loading={loading} variant="primary" />

            <View style={styles.loginLink}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <Text
                style={styles.loginLinkText}
                onPress={() => navigation.goBack()}
              >
                Sign In
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;
