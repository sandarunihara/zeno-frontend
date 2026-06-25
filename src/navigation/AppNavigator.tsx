import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import OnboardingStack from './OnboardingStack';
import AllTasksScreen from '../screens/Dashboard/AllTasksScreen';
import TaskDetailScreen from '../screens/Dashboard/TaskDetailScreen';
import SocialBatteryScreen from '../screens/Ghostbuster/SocialBatteryScreen';

const Stack = createNativeStackNavigator();

const AppNavigator: React.FC = () => {
  const { isLoggedIn, isLoading, onboardingComplete } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.button} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'fade',
        animationDuration: 200,
      }}
    >
      {!onboardingComplete ? (
        <Stack.Screen name="OnboardingStack" component={OnboardingStack} />
      ) : isLoggedIn ? (
        <>
          <Stack.Screen name="MainStack" component={MainStack} />
          <Stack.Screen name="AllTasks" component={AllTasksScreen} />
          <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
          <Stack.Screen name="SocialBattery" component={SocialBatteryScreen} />
        </>
      ) : (
        <Stack.Screen name="AuthStack" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
