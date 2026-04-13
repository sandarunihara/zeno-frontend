import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../store/AuthContext';
import { Button } from '../../components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<any, 'Dashboard'>;

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerClassName="flex-grow px-6 py-6"
      >
        <View className="flex-1 justify-between">
          <View>
            <View className="mb-8 self-start rounded-full border border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-black">
              <Text className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                Dashboard
              </Text>
            </View>

            <Text className="text-4xl font-bold tracking-tight text-black dark:text-white">
              Welcome back.
            </Text>
            <Text className="mt-3 text-base leading-6 text-zinc-500 dark:text-zinc-400">
              You're now signed into Zeno.
            </Text>

            <View className="mt-10 gap-4">
              <View className="rounded-[28px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black">
                <Text className="text-lg font-semibold text-black dark:text-white">
                  Fast access
                </Text>
                <Text className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  Clean navigation and secure token handling are ready.
                </Text>
              </View>

              <View className="rounded-[28px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black">
                <Text className="text-lg font-semibold text-black dark:text-white">
                  Private by design
                </Text>
                <Text className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  Tokens stay in SecureStore and refresh automatically.
                </Text>
              </View>

              <View className="rounded-[28px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black">
                <Text className="text-lg font-semibold text-black dark:text-white">
                  Minimal UI
                </Text>
                <Text className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  The interface is styled with NativeWind utility classes.
                </Text>
              </View>
            </View>
          </View>

          <Button title="Logout" onPress={handleLogout} variant="secondary" className="mt-8" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
