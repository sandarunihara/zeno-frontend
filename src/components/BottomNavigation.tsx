import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const ACCENT = '#5E5CE6';

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  state,
  navigation,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const activeRoute = state.routeNames[state.index];

  return (
    <View style={{ paddingBottom: Math.max(insets.bottom, 12), paddingHorizontal: 16, paddingTop: 8 }}>
      <View className="h-[72px] flex-row items-center justify-evenly rounded-[22px] border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-black">
        <Pressable
          className={[
            'min-w-20 items-center justify-center gap-1 rounded-2xl px-4 py-2',
            activeRoute === 'Dashboard' ? 'bg-indigo-50/80 dark:bg-indigo-950/35' : '',
          ].join(' ')}
          android_ripple={{ color: isDark ? '#27272a' : '#f4f4f5' }}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Home
            size={21}
            color={activeRoute === 'Dashboard' ? ACCENT : isDark ? '#71717A' : '#9CA3AF'}
            strokeWidth={2}
          />
          <Text
            className={[
              'text-xs font-semibold',
              activeRoute === 'Dashboard' ? 'text-[#5E5CE6]' : 'text-zinc-400 dark:text-zinc-500',
            ].join(' ')}
          >
            Home
          </Text>
          {activeRoute === 'Dashboard' && (
            <View className="h-1 w-1 rounded-full bg-[#5E5CE6]" />
          )}
        </Pressable>

      <Pressable
        className={[
          'min-w-20 items-center justify-center gap-1 rounded-2xl px-4 py-2',
          activeRoute === 'Profile' ? 'bg-sky-50 dark:bg-sky-950/40' : '',
        ].join(' ')}
        android_ripple={{ color: isDark ? '#27272a' : '#f4f4f5' }}
        onPress={() => navigation.navigate('Profile')}
      >
        <User
          size={21}
          color={activeRoute === 'Profile' ? ACCENT : isDark ? '#71717A' : '#9CA3AF'}
          strokeWidth={2}
        />
        <Text
          className={[
            'text-xs font-semibold',
            activeRoute === 'Profile' ? 'text-[#5E5CE6]' : 'text-zinc-400 dark:text-zinc-500',
          ].join(' ')}
        >
          {activeRoute === 'Profile' ? 'Profile' : 'Profile'}
        </Text>
        {activeRoute === 'Profile' && (
          <View className="h-1 w-1 rounded-full bg-[#5E5CE6]" />
        )}
      </Pressable>
      </View>
    </View>
  );
};

type BottomNavigationProps = BottomTabBarProps;
