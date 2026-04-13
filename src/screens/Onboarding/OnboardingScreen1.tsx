import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/Button';

type Props = NativeStackScreenProps<any, 'Onboarding1'>;

const OnboardingScreen1: React.FC<Props> = ({ navigation }) => {
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
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.icon}>✨</Text>
          <Text style={styles.title}>Welcome to Zeno</Text>
          <Text style={styles.subtitle}>
            Experience the future of mobile applications with a clean, minimalist design.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Next"
            onPress={() => navigation.navigate('Onboarding2')}
            variant="primary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen1;
