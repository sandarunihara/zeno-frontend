import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { Button } from '../../components/Button';

type Props = NativeStackScreenProps<any, 'Dashboard'>;

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
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
      paddingVertical: 24,
    },
    header: {
      marginBottom: 32,
    },
    greeting: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    cardContainer: {
      marginBottom: 24,
    },
    card: {
      backgroundColor: isDark ? '#1C1C1C' : '#F5F5F5',
      borderRadius: 16,
      padding: 24,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    cardDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    logoutButton: {
      marginTop: 24,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        <View style={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Welcome, User! 👋</Text>
            <Text style={styles.subtitle}>You're now logged in to Zeno</Text>
          </View>

          <View style={styles.cardContainer}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🎯 Get Started</Text>
              <Text style={styles.cardDescription}>
                Explore all the features Zeno has to offer. This is your personal dashboard where you can manage everything.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔐 Your Data is Safe</Text>
              <Text style={styles.cardDescription}>
                All your information is encrypted and securely stored. Your privacy is our priority.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>⚡ Built for Speed</Text>
              <Text style={styles.cardDescription}>
                Experience lightning-fast performance with our optimized app architecture.
              </Text>
            </View>
          </View>

          <Button
            title="Logout"
            onPress={handleLogout}
            variant="secondary"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
