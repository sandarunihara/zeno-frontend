import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import { useTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator();

const MainStack: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          animationTypeForReplace: 'pop',
        }}
      />
    </Stack.Navigator>
  );
};

export default MainStack;
