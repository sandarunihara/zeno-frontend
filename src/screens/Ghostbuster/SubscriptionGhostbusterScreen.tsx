import React, { useState, useEffect, useCallback } from 'react';
import { Pressable, Text, View, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { axiosClient } from '../../api/axiosClient';
import { Ghost, Mail, CheckCircle2, AlertCircle } from 'lucide-react-native';

GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '636937484642-75d0g92ab923ucc30fqjgl8a9hh0ahln.apps.googleusercontent.com',
  offlineAccess: true, // Requires offline access to get serverAuthCode
});

const SubscriptionGhostbusterScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

  const checkConnectionStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosClient.get('/api/auth/me');
      if (response.data && response.data.gmailToken) {
        setGmailConnected(true);
        setConnectedEmail(response.data.email);
      } else {
        setGmailConnected(false);
        setConnectedEmail(null);
      }
    } catch (error) {
      console.error('Error fetching connection status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  const handleConnectGmail = async () => {
    if (isConnecting) return;

    try {
      setIsConnecting(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (response.type === 'success') {
        const userInfo = response.data;
        if (userInfo.serverAuthCode) {
          const emailToUse = userInfo.user.email;

          // Connect Gmail via backend - it will associate the token to the logged in Zeno user via JWT
          await axiosClient.post('/api/auth/connect-gmail', {
            email: emailToUse,
            gmailToken: userInfo.serverAuthCode
          });

          Alert.alert('Success', 'Gmail Connected Successfully! Subscriptions will be extracted.');
          await checkConnectionStatus();
        } else {
          Alert.alert('Error', 'Failed to retrieve authorization code from Google.');
        }
      } else if (response.type === 'cancelled') {
        console.log('User cancelled the login flow');
      } else {
        console.log('Other response type:', response);
      }
    } catch (error: any) {
      if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress already');
      } else {
        console.error('Play services error or other error:', error);
        Alert.alert('Failed to connect Gmail', 'Please ensure you have registered your Google Account as a tester and try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA] dark:bg-black">
      <View className="flex-1 bg-[#F8F9FA] dark:bg-black px-6 pt-2 pb-32">
        <View className="absolute -left-12 -top-6 h-32 w-32 rounded-full bg-indigo-200/40 dark:bg-indigo-950/40" />
        <View className="absolute -right-12 top-20 h-28 w-28 rounded-full bg-sky-200/40 dark:bg-sky-950/40" />

        <View className="flex-row items-center gap-2 mt-4">
          <Ghost size={32} color="#6366f1" strokeWidth={2.5} />
          <Text className="text-[30px] font-bold tracking-tight text-zinc-900 dark:text-white">Ghostbuster</Text>
        </View>
        <Text className="mt-2 text-base text-zinc-500 dark:text-zinc-400">
          Find and manage hidden subscriptions automatically.
        </Text>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : !gmailConnected ? (
          /* Gmail is NULL - Show Connect Button */
          <View className="mt-8 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950/50">
            <View className="items-center mb-4">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40">
                <Mail size={32} color="#6366f1" />
              </View>
            </View>

            <Text className="text-center text-lg font-bold text-zinc-900 dark:text-white">
              Connect Your Inbox
            </Text>
            <Text className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Subscription Ghostbuster scans your email receipts to automatically detect subscriptions, billing dates, and cost changes so you never pay for a forgotten trial.
            </Text>

            <Pressable
              className="mt-6 flex-row items-center justify-center rounded-xl bg-indigo-600 py-3.5 active:bg-indigo-700 dark:bg-indigo-500"
              onPress={handleConnectGmail}
              disabled={isConnecting}
            >
              <Text className="text-base font-semibold text-white">
                {isConnecting ? 'Connecting...' : 'Connect Gmail'}
              </Text>
            </Pressable>

            <View className="mt-4 flex-row items-center justify-center gap-2">
              <AlertCircle size={14} color="#8e8e93" />
              <Text className="text-xs text-zinc-400 dark:text-zinc-500">
                Requires read-only access to receipts.
              </Text>
            </View>
          </View>
        ) : (
          /* Gmail is NOT NULL - Show Connected Status */
          <View className="mt-8 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-emerald-950/40 dark:bg-zinc-950/50">
            <View className="items-center mb-4">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
                <CheckCircle2 size={32} color="#10b981" />
              </View>
            </View>

            <Text className="text-center text-lg font-bold text-zinc-900 dark:text-white">
              Inbox Scanning Active
            </Text>
            
            <View className="mt-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/50">
              <Text className="text-center text-xs text-zinc-400 dark:text-zinc-500">CONNECTED ACCOUNT</Text>
              <Text className="mt-1 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {connectedEmail || 'Your Gmail'}
              </Text>
            </View>

            <Text className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Zeno is automatically scanning your inbox for new subscriptions. Any identified trials or bills will appear in your Dashboard shortly.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default SubscriptionGhostbusterScreen;
