import React, { useMemo } from 'react';
import 'react-native-reanimated';
import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/store/AuthContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

const RootNavigation: React.FC = () => {
  const { theme, isDark } = useTheme();

  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        background: theme.background,
        card: theme.background,
        text: theme.text,
        border: theme.border,
        primary: '#5E5CE6',
      },
    }),
    [isDark, theme.background, theme.border, theme.text]
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <RootNavigation />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
