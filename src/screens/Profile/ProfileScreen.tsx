import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../store/AuthContext';

const ProfileScreen: React.FC = () => {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA] dark:bg-black">
      <View className="flex-1 bg-[#F8F9FA] dark:bg-black px-6 pt-2 pb-32">
        <View className="absolute -left-12 -top-6 h-32 w-32 rounded-full bg-indigo-200/40 dark:bg-indigo-950/40" />
        <View className="absolute -right-12 top-20 h-28 w-28 rounded-full bg-sky-200/40 dark:bg-sky-950/40" />

        <Text className="text-[30px] font-bold tracking-tight text-zinc-900 dark:text-white">Profile</Text>
        <Text className="mt-2 text-base text-zinc-500 dark:text-zinc-400">Personal space coming soon</Text>

        <View className="mt-8 rounded-2xl border border-zinc-100 bg-white p-5 dark:border-zinc-900 dark:bg-black">
          <Text className="text-sm font-semibold uppercase tracking-[1.2px] text-indigo-600 dark:text-indigo-300">Status</Text>
          <Text className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Profile setup in progress</Text>
          <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">We will add account, preferences, and focus stats here.</Text>
        </View>

        <View className="mt-3 rounded-2xl border border-zinc-100 bg-white p-5 dark:border-zinc-900 dark:bg-black">
          <Text className="text-sm font-semibold uppercase tracking-[1.2px] text-indigo-600 dark:text-indigo-300">Preview</Text>
          <Text className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Clean layout with calm accent colors, consistent with Dashboard.</Text>
        </View>

        <Pressable
          className="mt-8 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-4 dark:border-red-950 dark:bg-red-950/20"
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Text className="text-sm font-semibold tracking-[1px] text-red-700 dark:text-red-300">
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;
