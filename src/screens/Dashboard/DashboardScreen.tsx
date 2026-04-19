import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronDown, ChevronRight, Circle, Mic } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

type TaskState = {
  main: boolean;
  sub: boolean[];
};

const ACCENT = '#5E5CE6';

const DashboardScreen: React.FC = () => {
  const { isDark } = useTheme();
  const [morningExpanded, setMorningExpanded] = useState(true);
  const [morningTask, setMorningTask] = useState<TaskState>({
    main: false,
    sub: [false, false, false],
  });
  const [clientCallDone, setClientCallDone] = useState(false);
  const [afternoonTaskDone, setAfternoonTaskDone] = useState(false);

  const microSteps = useMemo(
    () => [
      'Analyze last quarter metrics',
      'Draft projection report',
      'Prepare slide deck summary',
    ],
    []
  );

  const toggleMorningMain = () => {
    const next = !morningTask.main;
    setMorningTask({
      main: next,
      sub: morningTask.sub.map(() => next),
    });
  };

  const toggleMorningSub = (index: number) => {
    const nextSub = [...morningTask.sub];
    nextSub[index] = !nextSub[index];

    setMorningTask({
      sub: nextSub,
      main: nextSub.every(Boolean),
    });
  };

  const renderCheck = (checked: boolean) => (
    <View
      className={[
        'h-[22px] w-[22px] items-center justify-center rounded-full border-[1.6px] border-zinc-300 dark:border-zinc-700',
        checked ? 'border-[#5E5CE6]' : '',
      ].join(' ')}
    >
      {checked ? <View className="h-[10px] w-[10px] rounded-full bg-[#5E5CE6]" /> : null}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA] dark:bg-black">
      <View className="flex-1 bg-[#F8F9FA] dark:bg-black">
        <View className="absolute -left-12 -top-6 h-32 w-32 rounded-full bg-indigo-200/40 dark:bg-indigo-950/40" />
        <View className="absolute -right-12 top-40 h-28 w-28 rounded-full bg-sky-200/40 dark:bg-sky-950/40" />
        <View className="absolute left-20 bottom-32 h-24 w-24 rounded-full bg-rose-200/40 dark:bg-rose-950/40" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerClassName="px-6 pt-2 pb-32"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-[30px] font-bold tracking-tight text-zinc-900 dark:text-white">
              Good morning, Alex
            </Text>
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black"
              android_ripple={{ color: isDark ? '#27272a' : '#f4f4f5', radius: 20 }}
            >
              <Bell size={19} color={isDark ? '#E4E4E7' : '#334155'} strokeWidth={1.9} />
            </Pressable>
          </View>

          <View className="mt-4 self-start rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
            <Text className="text-[13px] font-semibold text-orange-800 dark:text-orange-200">
              ⚡ Energy: Low (20%)
            </Text>
          </View>

          <View className="mt-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-black">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-zinc-400 dark:text-zinc-500">Today</Text>
              <View className="rounded-full bg-indigo-50 px-3 py-1 dark:bg-indigo-950/40">
                <Text className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">Focus Mode</Text>
              </View>
            </View>
            <Text className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">2 priority tasks and 1 meeting pending.</Text>
          </View>

          <View className="mt-8 items-center justify-center">
            <View className="h-[156px] w-[156px] items-center justify-center rounded-full bg-[rgba(94,92,230,0.10)] dark:bg-[rgba(94,92,230,0.18)]">
              <Pressable
                className="h-[112px] w-[112px] items-center justify-center rounded-full border border-indigo-100 bg-white dark:border-zinc-900 dark:bg-zinc-950"
                android_ripple={{ color: isDark ? '#312e81' : '#eef2ff', radius: 60 }}
              >
                <Mic size={34} color={ACCENT} strokeWidth={2.1} />
              </Pressable>
            </View>
            <Text className="mt-3 text-xs font-bold tracking-[2.2px] text-[#5E5CE6]">
              BRAIN DUMP
            </Text>
          </View>

          <View className="mb-2 mt-9 flex-row items-center justify-between">
            <Text className="text-[11px] font-bold tracking-[1.3px] text-zinc-400 dark:text-zinc-500">
              MORNING BLOCK
            </Text>
            <Text className="text-[11px] font-semibold tracking-[1.1px] text-zinc-400 dark:text-zinc-500">
              08:00 - 12:00
            </Text>
          </View>

          <View className="mb-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3.5 dark:border-zinc-900 dark:bg-black">
            <Pressable
              className="flex-row items-center gap-3"
              onPress={() => setMorningExpanded((prev) => !prev)}
              android_ripple={{ color: isDark ? '#27272a' : '#f4f4f5' }}
            >
              <Pressable
                className="rounded-full"
                hitSlop={8}
                onPress={(event) => {
                  event.stopPropagation();
                  toggleMorningMain();
                }}
              >
                {renderCheck(morningTask.main)}
              </Pressable>
              <Text className="flex-1 text-base font-semibold text-zinc-900 dark:text-white">
                Q3 Strategy Review
              </Text>
              {morningExpanded ? (
                <ChevronDown size={18} color={isDark ? '#71717A' : '#94A3B8'} strokeWidth={2} />
              ) : (
                <ChevronRight size={18} color={isDark ? '#71717A' : '#94A3B8'} strokeWidth={2} />
              )}
            </Pressable>

            {morningExpanded ? (
              <View className="mt-3 ml-[14px] gap-3 border-l border-zinc-100 pl-3 dark:border-zinc-900">
                {microSteps.map((step, index) => (
                  <Pressable
                    key={step}
                    className="flex-row items-center gap-3"
                    onPress={() => toggleMorningSub(index)}
                    android_ripple={{ color: isDark ? '#27272a' : '#f4f4f5' }}
                  >
                    {renderCheck(morningTask.sub[index])}
                    <Text className="flex-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                      {step}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <Pressable
            className="mb-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3.5 dark:border-zinc-900 dark:bg-black"
            onPress={() => setClientCallDone((prev) => !prev)}
            android_ripple={{ color: isDark ? '#27272a' : '#f4f4f5' }}
          >
            <View className="flex-row items-center gap-3">
              {renderCheck(clientCallDone)}
              <Text className="flex-1 text-base font-semibold text-zinc-900 dark:text-white">
                Client briefing call
              </Text>
              <Circle size={16} color="transparent" />
            </View>
          </Pressable>

          <View className="mb-2 mt-4 flex-row items-center justify-between">
            <Text className="text-[11px] font-bold tracking-[1.3px] text-zinc-400 dark:text-zinc-500">
              AFTERNOON BLOCK
            </Text>
            <Text className="text-[11px] font-semibold tracking-[1.1px] text-zinc-400 dark:text-zinc-500">
              13:00 - 17:00
            </Text>
          </View>

          <Pressable
            className="mb-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3.5 dark:border-zinc-900 dark:bg-black"
            onPress={() => setAfternoonTaskDone((prev) => !prev)}
            android_ripple={{ color: isDark ? '#27272a' : '#f4f4f5' }}
          >
            <View className="flex-row items-center gap-3">
              {renderCheck(afternoonTaskDone)}
              <Text className="flex-1 text-base font-semibold text-zinc-900 dark:text-white">
                Deep work: Coding UI components
              </Text>
              <Circle size={16} color="transparent" />
            </View>
          </Pressable>
        </ScrollView>

      </View>
    </SafeAreaView>
  );
};

export default DashboardScreen;
