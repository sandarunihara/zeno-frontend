import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import { useTheme } from '../theme/ThemeContext';
import { BottomNavigation } from '../components/BottomNavigation';

const Tab = createBottomTabNavigator();

const MainStack: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: theme.background }}
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomNavigation {...props} />}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
};

export default MainStack;
