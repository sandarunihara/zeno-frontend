import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/Button';

type Props = NativeStackScreenProps<any, 'Onboarding2'>;

const OnboardingScreen2: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();

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
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Secure & Private</Text>
          <Text style={styles.subtitle}>
            Your data is encrypted and protected. We never share your information.
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
              title="Next"
              onPress={() => navigation.navigate('Onboarding3')}
              variant="primary"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen2;
