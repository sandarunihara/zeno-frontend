import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronDown, ChevronRight, Circle, Mic } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { dashboardApi } from '../../api/dashboardApi';

type TaskState = {
  main: boolean;
  sub: boolean[];
};

const ACCENT = '#5E5CE6';
const moodCheckShadowStyle = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 6,
  elevation: 2,
};
const moodCheckHighlightStyle = {
  borderColor: '#6366F1',
  shadowColor: '#6366F1',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.16,
  shadowRadius: 14,
  elevation: 4,
};

const DashboardScreen: React.FC = () => {
  const { isDark } = useTheme();
  const [energyScore, setEnergyScore] = useState<number | null>(null);
  const [energyLoading, setEnergyLoading] = useState(true);
  const [needsMoodCheck, setNeedsMoodCheck] = useState(false);
  const [askConsent, setAskConsent] = useState(false);
  const [keepItLight, setKeepItLight] = useState<boolean | null>(null);
  const [exsistmoodlog, setExsistMoodlog] = useState({
    mood : 0,
    keepItLight : false
  });

  const [morningExpanded, setMorningExpanded] = useState(true);
  const [morningTask, setMorningTask] = useState<TaskState>({
    main: false,
    sub: [false, false, false],
  });
  const [clientCallDone, setClientCallDone] = useState(false);
  const [afternoonTaskDone, setAfternoonTaskDone] = useState(false);

  useEffect(() => {
    const fetchMoodlog = async () => {
      try {
        const response = await dashboardApi.getMoodlog();
        if (response.success && response.moodLog) {
          setEnergyScore(response.moodLog.energyScore);
          console.log(response.moodLog.isLight);

          fetchDashboardTasks(response.moodLog.energyScore, response.moodLog.isLight);

          setNeedsMoodCheck(false);
        } else {
          setNeedsMoodCheck(true);
        }
      } catch {
        setNeedsMoodCheck(true);
        setEnergyScore(null);
      } finally {
        setEnergyLoading(false);
      }
    };
    fetchMoodlog();
  }, []);

  const fetchDashboardTasks = async (mood?: number, keepItLight?: boolean) => {
    try{
      if(mood === undefined) {
        console.warn("Mood is undefined, skipping dashboard tasks fetch");
        return;
      } 
      
      const dashboardData = await dashboardApi.getDashboardTasks(keepItLight);
      console.log(dashboardData);

    }catch(error){
        console.error("Failed to fetch dashboard tasks", error);
    }
  };

  const getEnergyLabel = () => {
    if (energyLoading) {
      return 'Loading...';
    }

    if (energyScore === null) {
      return 'Unknown';
    }

    if (energyScore <= 3) {
      return 'Low';
    }

    if (energyScore <= 7) {
      return 'Moderate';
    }

    return 'High';
  };

  const handleMoodSelect = async (score: number) => {
    // Optimistic UI update: instantly hide emojis and show the pill
    setEnergyScore(score);
    setNeedsMoodCheck(false);
    if(score >= 8) {
      setAskConsent(true);
    }else{
      try {
        // Call the backend API we set up earlier!
        const response = await dashboardApi.createorupdateMoodlog(score, false);
         if (response.success && response.moodLog) {
          setEnergyScore(response.moodLog.energyScore);
          console.log("low or mid");
          const dashboardData = await dashboardApi.getDashboardTasks();
          console.log(dashboardData);
          
        } else {
          setNeedsMoodCheck(true);
        }
        // OPTIONAL: Here is where you could also trigger a re-fetch of your 
        // tasks to update the Smart Dashboard based on the new energy score!
      } catch (error) {
        console.error("Failed to save mood", error);
        // If it fails, revert the UI back so they can try again
        setNeedsMoodCheck(true);
        setEnergyScore(null);
      }

    }

  };

  const handleConsentChoice = async (isLight: boolean) => {
    setKeepItLight(isLight);
    setAskConsent(false);
    
    // Now we re-fetch the tasks with the user's preference
    try {
      if(energyScore === null) {
        console.warn("Energy score is null, cannot update moodlog with consent choice");
        return;
      }
      const response = await dashboardApi.createorupdateMoodlog(energyScore, isLight);
      if (response.success && response.moodLog) {
        setEnergyScore(response.moodLog.energyScore);
        const dashboardData = await dashboardApi.getDashboardTasks(isLight);
      }else {
        console.warn("Failed to update moodlog with consent choice, response:", response);
      }
      // console.log("Updated Tasks based on consent:", dashboardData);
      
    } catch (error) {
      console.error("Failed to fetch tasks after consent", error);
    }
  };
  
  // useEffect(()=>{
  //   const fetchDashboardTasks = async () => {
  //     try {

  //       if(exsistmoodlog.mood === null) {
  //         console.warn("Energy score is null, skipping dashboard tasks fetch");
  //         return;
  //       }
  //       const dashboardData = await dashboardApi.getDashboardTasks();
        
  //     } catch (error) {
  //       console.error("Failed to fetch dashboard tasks", error);
  //     }
  //   };
  //   fetchDashboardTasks();
  // }, [exsistmoodlog]);

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

  const renderConsentPopup = () => (
  <Modal
    transparent
    visible={askConsent}
    animationType="fade"
    onRequestClose={() => setAskConsent(false)}
  >
    <View className="flex-1 items-center justify-center bg-black/40 px-6">
      <View className="w-full rounded-[28px] bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
        <View className="items-center">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/30">
            <Text className="text-2xl">💪</Text>
          </View>
          <Text className="mt-4 text-center text-xl font-bold text-zinc-900 dark:text-white">
            High Energy Detected!
          </Text>
          <Text className="mt-2 text-center text-[15px] leading-5 text-zinc-500 dark:text-zinc-400">
            You're feeling great today. Do you want to tackle your most difficult tasks, or would you prefer to keep your day light?
          </Text>
        </View>

        <View className="mt-8 gap-3">
          <Pressable
            onPress={() => handleConsentChoice(false)}
            className="w-full rounded-2xl bg-[#5E5CE6] py-4 active:opacity-90"
          >
            <Text className="text-center font-bold text-white">Let's Crush It!</Text>
          </Pressable>

          <Pressable
            onPress={() => handleConsentChoice(true)}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 dark:border-zinc-800 dark:bg-zinc-800/50 active:opacity-70"
          >
            <Text className="text-center font-bold text-zinc-700 dark:text-zinc-300">Keep It Light</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

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
          {energyLoading ? (
            <View className="mt-4 self-start rounded-full border border-zinc-100 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
              <Text className="text-[13px] font-semibold text-zinc-400">Loading energy...</Text>
            </View>
          ) : needsMoodCheck ? (
            <View
              className="mt-4 w-full rounded-2xl border bg-white px-4 py-4 dark:border-zinc-700 flex-row items-center justify-between gap-3 dark:bg-zinc-900"
              style={[moodCheckShadowStyle, moodCheckHighlightStyle]}
            >
              <View className="flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-[1px] text-indigo-600 dark:text-indigo-300">Mood Check</Text>
                <Text className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">How is your energy right now?</Text>
                <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Pick one to personalize your dashboard.</Text>
              </View>

              <Pressable
                onPress={() => handleMoodSelect(2)}
                className="h-10 w-10 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 active:opacity-70"
              >
                <Text className="text-xl">🥱</Text>
              </Pressable>

              <Pressable
                onPress={() => handleMoodSelect(5)}
                className="h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 active:opacity-70"
              >
                <Text className="text-xl">😌</Text>
              </Pressable>

              <Pressable
                onPress={() => handleMoodSelect(9)}
                className="h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 active:opacity-70"
              >
                <Text className="text-xl">⚡</Text>
              </Pressable>
            </View>
          ) : (
            <View className="mt-4 self-start rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
              <Text className="text-[13px] font-semibold text-orange-800 dark:text-orange-200">
                ⚡ Energy: {getEnergyLabel()} ({energyScore !== null ? energyScore * 10 : '--'}%)
              </Text>
            </View>
          )}

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
      {renderConsentPopup()}
    </SafeAreaView>
  );
};

export default DashboardScreen;
