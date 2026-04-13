import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { Button } from '../../components/Button';

type Props = NativeStackScreenProps<any, 'Onboarding4'>;

const OnboardingScreen4: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { completeOnboarding } = useAuth();

  const handleGetStarted = async () => {
    await completeOnboarding();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    safeArea: {
      flex: 1,
      width: '100%',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 36,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 40,
    },
    icon: {
      fontSize: 80,
      marginBottom: 32,
    },
    buttonContainer: {
      width: '100%',
      gap: 12,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.icon}>🚀</Text>
          <Text style={styles.title}>Ready to Begin?</Text>
          <Text style={styles.subtitle}>
            Create an account or log in to access all the amazing features Zeno has to offer.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <View style={styles.buttonRow}>
            <Button
              title="Back"
              onPress={() => navigation.goBack()}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <Button
              title="Get Started"
              onPress={handleGetStarted}
              variant="primary"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen4;
