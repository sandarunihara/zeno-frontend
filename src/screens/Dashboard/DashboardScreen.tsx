import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, ChevronDown, ChevronRight, Clock, Mic, AlertTriangle, RefreshCw, Plus, Flag } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { dashboardApi, Task, FreeTimeResponse } from '../../api/dashboardApi';
import { healthApi, StepBucketResponse, SleepRecordResponse } from '../../api/healthApi';
import { authApi, UserProfile } from '../../api/authApi';
import BrainDumpModal from '../../components/Dashboard/BrainDumpModal';
import CreateTaskModal from '../../components/Dashboard/CreateTaskModal';

/** Format an ISO-8601 deadline string into a human-friendly label */
const formatDeadline = (deadline?: string | null): string | null => {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today, ${time}`;
  if (isTomorrow) return `Tomorrow, ${time}`;

  const month = d.toLocaleString('default', { month: 'short' });
  return `${month} ${d.getDate()}, ${time}`;
};

/** Check if a deadline is within the next 24 hours */
const isUrgent = (deadline?: string | null): boolean => {
  if (!deadline) return false;
  const d = new Date(deadline);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return diff > 0 && diff < 24 * 60 * 60 * 1000;
};

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { isDark } = useTheme();
  const [energyScore, setEnergyScore] = useState<number | null>(null);
  const [stepsData, setStepsData] = useState<StepBucketResponse | null>(null);
  const [latestSleep, setLatestSleep] = useState<SleepRecordResponse | null>(null);
  const [stepsLoading, setStepsLoading] = useState(true);
  const [energyLoading, setEnergyLoading] = useState(true);
  const [needsMoodCheck, setNeedsMoodCheck] = useState(false);
  const [askConsent, setAskConsent] = useState(false);
  const [keepItLight, setKeepItLight] = useState<boolean | null>(null);
  const [empatheticMessage, setEmpatheticMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [freeTimeData, setFreeTimeData] = useState<FreeTimeResponse | null>(null);
  const [freeTimeLoading, setFreeTimeLoading] = useState(false);

  const [displayTasks, setDisplayTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [isBrainDumpVisible, setIsBrainDumpVisible] = useState(false);
  const [isCreateTaskVisible, setIsCreateTaskVisible] = useState(false);
  const [showMicTooltip, setShowMicTooltip] = useState(false);
  const justSetMoodRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [checkedTasks, setCheckedTasks] = useState<Record<number, boolean>>({});
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<'tasks' | 'calendar'>('tasks');

  const applyDashboardData = useCallback((data: { displayTasks: Task[]; empatheticMessage: string; askConsent: boolean }) => {
    setDisplayTasks(data.displayTasks ?? []);
    setEmpatheticMessage(data.empatheticMessage ?? null);
    const expanded: Record<number, boolean> = {};
    (data.displayTasks ?? []).forEach((t) => {
      if (t.microSteps && t.microSteps.length > 0) {
        expanded[t.id] = true;
      }
    });
    setExpandedTasks(expanded);
  }, []);

  const fetchDashboardTasks = useCallback(async (mood?: number, isLight?: boolean) => {
    try {
      if (mood === undefined) {
        console.warn("Mood is undefined, skipping dashboard tasks fetch");
        return;
      }
      setTasksLoading(true);
      const dashboardData = await dashboardApi.getDashboardTasks(isLight);
      applyDashboardData(dashboardData);
    } catch (error) {
      console.error("Failed to fetch dashboard tasks", error);
    } finally {
      setTasksLoading(false);
    }
  }, [applyDashboardData]);

  const fetchFreeTime = useCallback(async () => {
    try {
      setFreeTimeLoading(true);
      const data = await dashboardApi.getTodaysFreeTime();
      setFreeTimeData(data);
    } catch (error) {
      console.error("Failed to fetch free time", error);
    } finally {
      setFreeTimeLoading(false);
    }
  }, []);

  const fetchMoodlog = useCallback(async () => {
    setEnergyLoading(true);
    try {
      const response = await dashboardApi.getMoodlog();
      if (response.success && response.moodLog) {
        setEnergyScore(response.moodLog.energyScore);
        await fetchDashboardTasks(response.moodLog.energyScore, response.moodLog.isLight);
        fetchFreeTime();
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
  }, [fetchDashboardTasks, fetchFreeTime]);

  const fetchStepsToday = useCallback(async () => {
    try {
      setStepsLoading(true);
      const data = await healthApi.getStepsToday();
      if (data && data.success) {
        setStepsData(data);
      }
    } catch (error) {
      console.error("Failed to fetch steps today", error);
    } finally {
      setStepsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMoodlog();
    fetchStepsToday();
    authApi.getMe().then(setProfile).catch(console.error);
    healthApi.getLatestSleep().then(setLatestSleep).catch(console.error);
  }, [fetchMoodlog, fetchStepsToday]);

  // Pulse animation for mic tooltip glow ring
  useEffect(() => {
    if (showMicTooltip) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.35, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [showMicTooltip, pulseAnim]);

  // Dismiss tooltip when user navigates away from Dashboard
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setShowMicTooltip(false);
    });
    return unsubscribe;
  }, [navigation]);

  const getEnergyLabel = () => {
    if (energyLoading) return 'Loading...';
    if (energyScore === null) return 'Unknown';
    if (energyScore <= 3) return 'Low';
    if (energyScore <= 7) return 'Moderate';
    return 'High';
  };

  const getEnergyEmoji = () => {
    if (energyScore === null) return '⚡';
    if (energyScore <= 3) return '🔋';
    if (energyScore <= 7) return '⚡';
    return '🔥';
  };

  const handleMoodSelect = async (score: number) => {
    setEnergyScore(score);
    setNeedsMoodCheck(false);
    justSetMoodRef.current = true;
    if (score >= 8) {
      setAskConsent(true);
    } else {
      try {
        const response = await dashboardApi.createorupdateMoodlog(score, false);
        if (response.success && response.moodLog) {
          setEnergyScore(response.moodLog.energyScore);
          setTasksLoading(true);
          const dashboardData = await dashboardApi.getDashboardTasks();
          applyDashboardData(dashboardData);
          setTasksLoading(false);
          fetchFreeTime();
          // Show mic tooltip after mood is set for the first time today
          if (justSetMoodRef.current) {
            setShowMicTooltip(true);
            justSetMoodRef.current = false;
          }
        } else {
          setNeedsMoodCheck(true);
        }
      } catch (error) {
        console.error("Failed to save mood", error);
        setNeedsMoodCheck(true);
        setEnergyScore(null);
      }
    }
  };

  const handleConsentChoice = async (isLight: boolean) => {
    setKeepItLight(isLight);
    setAskConsent(false);

    try {
      if (energyScore === null) {
        console.warn("Energy score is null, cannot update moodlog with consent choice");
        return;
      }
      const response = await dashboardApi.createorupdateMoodlog(energyScore, isLight);
      if (response.success && response.moodLog) {
        setEnergyScore(response.moodLog.energyScore);
        setTasksLoading(true);
        const dashboardData = await dashboardApi.getDashboardTasks(isLight);
        applyDashboardData(dashboardData);
        setTasksLoading(false);
        fetchFreeTime();
        // Show mic tooltip after consent flow completes (high energy mood path)
        if (justSetMoodRef.current) {
          setShowMicTooltip(true);
          justSetMoodRef.current = false;
        }
      } else {
        console.warn("Failed to update moodlog with consent choice, response:", response);
      }
    } catch (error) {
      console.error("Failed to fetch tasks after consent", error);
    }
  };

  const toggleTaskChecked = (taskId: number) => {
    setCheckedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const toggleParentChecked = (task: Task) => {
    const next = !checkedTasks[task.id];
    const updates: Record<number, boolean> = { [task.id]: next };
    if (task.microSteps) {
      task.microSteps.forEach((ms) => {
        updates[ms.id] = next;
      });
    }
    setCheckedTasks((prev) => ({ ...prev, ...updates }));
  };

  const toggleMicroStep = (parentTask: Task, microStepId: number) => {
    setCheckedTasks((prev) => {
      const next = { ...prev, [microStepId]: !prev[microStepId] };
      if (parentTask.microSteps) {
        const allChecked = parentTask.microSteps.every((ms) => next[ms.id]);
        next[parentTask.id] = allChecked;
      }
      return next;
    });
  };

  const toggleExpanded = (taskId: number) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const renderCheck = (checked: boolean) => (
    <View
      className={[
        'h-[22px] w-[22px] items-center justify-center rounded-full border-[1.8px]',
        checked
          ? 'border-[#34C759] bg-[#34C759]'
          : 'border-zinc-300 dark:border-zinc-600',
      ].join(' ')}
    >
      {checked ? (
        <Text className="text-[11px] font-bold text-white leading-[13px]">✓</Text>
      ) : null}
    </View>
  );

  const renderEffortBadge = (effort: string) => {
    const config: Record<string, { emoji: string; color: string }> = {
      Low: { emoji: '🍃', color: 'text-green-600 dark:text-green-400' },
      Medium: { emoji: '⚡', color: 'text-orange-600 dark:text-orange-400' },
      High: { emoji: '🔥', color: 'text-red-600 dark:text-red-400' },
    };
    const c = config[effort] ?? config.Medium;
    return (
      <Text className={`text-[11px] font-semibold ${c.color}`}>
        {c.emoji} {effort}
      </Text>
    );
  };

  const renderTaskCard = (task: Task) => {
    const hasMicro = task.microSteps && task.microSteps.length > 0;
    const checked = !!checkedTasks[task.id];
    const expanded = !!expandedTasks[task.id];
    const deadline = formatDeadline(task.deadline);
    const urgent = isUrgent(task.deadline);
    const isCompleted = task.status === 'COMPLETED';

    return (
      <View
        key={task.id}
        className="mb-3 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 overflow-hidden"
      >
        <Pressable
          className="flex-row items-center px-4 py-3.5"
          onPress={() => { setShowMicTooltip(false); navigation.navigate('TaskDetail', { taskId: task.id }); }}
          android_ripple={{ color: isDark ? '#2C2C2E' : '#F2F2F7' }}
        >
          <Pressable
            hitSlop={10}
            onPress={(e) => {
              e.stopPropagation();
              if (hasMicro) toggleParentChecked(task);
              else toggleTaskChecked(task.id);
            }}
            className="mr-3"
          >
            {renderCheck(checked || isCompleted)}
          </Pressable>

          <View className="flex-1 mr-2">
            <View className="flex-row items-center gap-2">
              <Text
                className={[
                  'flex-1 text-[16px] font-medium',
                  (checked || isCompleted)
                    ? 'text-zinc-400 line-through dark:text-zinc-600'
                    : 'text-zinc-900 dark:text-white',
                ].join(' ')}
                numberOfLines={2}
              >
                {task.title}
              </Text>
              {task.is_critical && (
                <Flag size={13} color="#FF3B30" fill="#FF3B30" />
              )}
            </View>

            <View className="flex-row items-center gap-3 mt-1.5">
              {renderEffortBadge(task.effort_level)}
              {deadline && (
                <View className="flex-row items-center gap-1">
                  {urgent ? (
                    <AlertTriangle size={10} color="#FF3B30" strokeWidth={2.4} />
                  ) : (
                    <Clock size={10} color="#8E8E93" strokeWidth={2.4} />
                  )}
                  <Text className={`text-[11px] font-medium ${urgent ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {deadline}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {hasMicro && (
            <Pressable
              onPress={(e) => { e.stopPropagation(); toggleExpanded(task.id); }}
              hitSlop={10}
              className="p-1"
            >
              {expanded
                ? <ChevronDown size={16} color={isDark ? '#636366' : '#C7C7CC'} strokeWidth={2.2} />
                : <ChevronRight size={16} color={isDark ? '#636366' : '#C7C7CC'} strokeWidth={2.2} />
              }
            </Pressable>
          )}
        </Pressable>

        {hasMicro && expanded && task.microSteps ? (
          <View className="border-t border-zinc-100 dark:border-zinc-900">
            {task.microSteps.map((step, index) => {
              const stepChecked = !!checkedTasks[step.id];
              const isLast = index === task.microSteps!.length - 1;
              return (
                <Pressable
                  key={step.id}
                  className={`flex-row items-center pl-[52px] pr-4 py-2.5 ${!isLast ? 'border-b border-zinc-100 dark:border-zinc-900' : ''}`}
                  onPress={() => { setShowMicTooltip(false); navigation.navigate('TaskDetail', { taskId: step.id }); }}
                  android_ripple={{ color: isDark ? '#2C2C2E' : '#F2F2F7' }}
                >
                  <Pressable
                    hitSlop={8}
                    onPress={(e) => { e.stopPropagation(); toggleMicroStep(task, step.id); }}
                    className="mr-3"
                  >
                    {renderCheck(stepChecked)}
                  </Pressable>
                  <View className="flex-1">
                    <Text
                      className={[
                        'text-[14px]',
                        stepChecked
                          ? 'text-zinc-400 line-through dark:text-zinc-600'
                          : 'text-zinc-700 dark:text-zinc-300',
                      ].join(' ')}
                    >
                      {step.title}
                    </Text>
                    {step.deadline && (
                      <Text className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {formatDeadline(step.deadline)}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  };

  const renderMoodCheckModal = () => (
    <Modal transparent visible={needsMoodCheck && !energyLoading} animationType="fade">
      <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={{
          backgroundColor: isDark ? '#121214' : '#fff',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: isDark ? '#27272a' : '#e4e4e7',
          paddingTop: 32,
          paddingBottom: 28,
          paddingHorizontal: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 12,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            <View style={{
              height: 24, width: 24, borderRadius: 6,
              backgroundColor: isDark ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.1)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 12 }}>🎯</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#007AFF' }}>Mood Check</Text>
          </View>

          <Text style={{ fontSize: 17, fontWeight: '700', textAlign: 'center', color: isDark ? '#fff' : '#18181b', marginBottom: 6 }}>
            {latestSleep?.success && latestSleep.totalSleepHours !== null && latestSleep.totalSleepHours < (profile?.sleepTarget ? profile.sleepTarget - 1.5 : 6)
              ? "I see you had a rough night of sleep."
              : "How's your energy right now?"}
          </Text>

          <Text style={{ fontSize: 14, textAlign: 'center', color: isDark ? '#a1a1aa' : '#71717a', lineHeight: 20, marginBottom: 28 }}>
            {latestSleep?.success && latestSleep.totalSleepHours !== null && latestSleep.totalSleepHours < (profile?.sleepTarget ? profile.sleepTarget - 1.5 : 6)
              ? "I've prepared a 'Rest Mode' schedule for today, but how are you actually feeling?"
              : "Log your energy level so we can personalize your tasks for today."}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
            <Pressable
              onPress={() => handleMoodSelect(2)}
              android_ripple={{ color: isDark ? '#27272a' : '#f4f4f5', radius: 40 }}
              style={({ pressed }) => ({ alignItems: 'center', width: 70, opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{
                height: 60, width: 60, borderRadius: 16,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: isDark ? '#27272a' : '#e4e4e7',
                backgroundColor: isDark ? '#18181b' : '#fafafa',
                marginBottom: 8,
              }}>
                <Text style={{ fontSize: 28 }}>🥱</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#a1a1aa' : '#52525b', textAlign: 'center' }}>Low</Text>
            </Pressable>

            <Pressable
              onPress={() => handleMoodSelect(5)}
              android_ripple={{ color: isDark ? '#27272a' : '#f4f4f5', radius: 40 }}
              style={({ pressed }) => ({ alignItems: 'center', width: 70, opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{
                height: 60, width: 60, borderRadius: 16,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: isDark ? '#27272a' : '#e4e4e7',
                backgroundColor: isDark ? '#18181b' : '#fafafa',
                marginBottom: 8,
              }}>
                <Text style={{ fontSize: 28 }}>😌</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#a1a1aa' : '#52525b', textAlign: 'center' }}>Okay</Text>
            </Pressable>

            <Pressable
              onPress={() => handleMoodSelect(9)}
              android_ripple={{ color: isDark ? '#27272a' : '#f4f4f5', radius: 40 }}
              style={({ pressed }) => ({ alignItems: 'center', width: 70, opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{
                height: 60, width: 60, borderRadius: 16,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: isDark ? '#27272a' : '#e4e4e7',
                backgroundColor: isDark ? '#18181b' : '#fafafa',
                marginBottom: 8,
              }}>
                <Text style={{ fontSize: 28 }}>⚡</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#a1a1aa' : '#52525b', textAlign: 'center' }}>High</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderConsentPopup = () => (
    <Modal transparent visible={askConsent} animationType="fade" onRequestClose={() => setAskConsent(false)}>
      <View className="flex-1 items-center justify-center bg-black/40 px-8">
        <View className="w-full rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 }}
        >
          <View className="px-6 pt-6 pb-5 items-center">
            <Text className="text-3xl mb-3">💪</Text>
            <Text className="text-[17px] font-semibold text-zinc-900 dark:text-white text-center">High Energy Detected!</Text>
            <Text className="mt-2 text-[14px] leading-5 text-zinc-500 dark:text-zinc-400 text-center">
              You're feeling great today. Do you want to tackle your most difficult tasks, or keep your day light?
            </Text>
          </View>
          <View className="border-t border-zinc-200 dark:border-zinc-800">
            <Pressable onPress={() => handleConsentChoice(false)} className="py-3.5 items-center border-b border-zinc-200 dark:border-zinc-800 active:bg-zinc-50 dark:active:bg-zinc-900">
              <Text className="text-[17px] font-semibold text-[#007AFF]">Let's Crush It!</Text>
            </Pressable>
            <Pressable onPress={() => handleConsentChoice(true)} className="py-3.5 items-center active:bg-zinc-50 dark:active:bg-zinc-900">
              <Text className="text-[17px] text-[#007AFF]">Keep It Light</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  const topLevelTasks = displayTasks.filter((t) => {
    if (t.parentTaskId) return false;
    if (activeTab === 'tasks') return !t.isFromCalender;
    return !!t.isFromCalender;
  });

  const pendingCount = topLevelTasks.filter((t) => !checkedTasks[t.id]).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="flex-1 bg-white dark:bg-black">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 150 }}
        >
          {/* ─── Compact Consolidated Header ─── */}
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {getGreeting()}
              </Text>
              <Text className="text-2xl font-bold tracking-tight text-black dark:text-white mt-0.5">
                {profile?.fname || 'There'} 👋
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => {
                  fetchMoodlog();
                  fetchStepsToday();
                }}
                className="h-10 w-10 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
                android_ripple={{ color: isDark ? '#2C2C2E' : '#F2F2F7', radius: 20 }}
              >
                <RefreshCw size={15} color={isDark ? '#A1A1AA' : '#52525B'} strokeWidth={2} />
              </Pressable>

              <Pressable
                className="h-10 w-10 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
                android_ripple={{ color: isDark ? '#2C2C2E' : '#F2F2F7', radius: 20 }}
              >
                <Bell size={17} color={isDark ? '#A1A1AA' : '#52525B'} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          {/* ─── Unified Daily Insights Dashboard Widget ─── */}
          <View className="rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/80 p-4 mb-6">
            {/* Status Metrics Strip */}
            <View className="flex-row items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
              <View className="flex-row items-center gap-2">
                <Text className="text-base">{getEnergyEmoji()}</Text>
                <View>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Energy Level</Text>
                  <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {energyLoading ? 'Loading...' : `${getEnergyLabel()} (${energyScore !== null ? energyScore * 10 : '--'}%)`}
                  </Text>
                </View>
              </View>

              {!needsMoodCheck && !energyLoading && freeTimeData?.totalFreeTimeInMinutes !== undefined && (
                <View className="flex-row items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-4">
                  <Clock size={14} color="#34C759" strokeWidth={2.5} />
                  <View>
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Free Windows</Text>
                    <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {freeTimeLoading ? 'Loading...' : `${Math.floor(freeTimeData.totalFreeTimeInMinutes / 60)}h ${freeTimeData.totalFreeTimeInMinutes % 60}m`}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* AI Core Direct Context Placement */}
            <View className="pt-3">
              {needsMoodCheck ? (
                <Text className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-5 font-medium">
                  To set up your daily priorities, log your energy level to personalize your focus playbook.
                </Text>
              ) : (
                <Text className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-5">
                  {empatheticMessage
                    ? empatheticMessage
                    : tasksLoading
                      ? 'Syncing today\'s playbook...'
                      : `${pendingCount === 0 ? '✨ All clear for now! Enjoy your day.' : `📅 You have ${pendingCount} target${pendingCount !== 1 ? 's' : ''} left to clear today.`}`
                  }
                </Text>
              )}
            </View>

            {/* Horizontal Free Time Badge Carousels */}
            {!needsMoodCheck && !energyLoading && !freeTimeLoading && freeTimeData?.freeTimeSlots && freeTimeData.freeTimeSlots.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                className="mt-3 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800"
                contentContainerStyle={{ gap: 6 }}
              >
                {freeTimeData.freeTimeSlots.map((slot, idx) => (
                  <View key={idx} className="rounded-full bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-2.5 py-1 flex-row items-center">
                    <Text className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      ⏱️ {slot.from} - {slot.to}
                    </Text>
                    <Text className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 ml-1">
                      ({slot.durationInMinutes}m)
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ─── Tasks Section Header ─── */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 ml-1">
              Your Tasks
            </Text>
            <View className="flex-row items-center gap-3">
              <Text className="text-[13px] font-medium text-zinc-400 dark:text-zinc-500">
                {pendingCount} pending
              </Text>
              <Pressable
                onPress={() => setIsCreateTaskVisible(true)}
                className="h-8 w-8 items-center justify-center rounded-full bg-[#007AFF] active:opacity-80"
                style={{ shadowColor: '#007AFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}
              >
                <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>

          {/* Navigation Tab Selectors */}
          <View className="flex-row rounded-full bg-zinc-100 dark:bg-zinc-900 p-1 mb-4">
            <Pressable
              onPress={() => setActiveTab('tasks')}
              className={`flex-1 py-2.5 rounded-full items-center justify-center ${activeTab === 'tasks' ? 'bg-white dark:bg-zinc-800' : ''}`}
              style={activeTab === 'tasks' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1.5, elevation: 2 } : undefined}
            >
              <Text className={`text-sm font-semibold ${activeTab === 'tasks' ? 'text-black dark:text-white' : 'text-zinc-400'}`}>
                My Tasks
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('calendar')}
              className={`flex-1 py-2.5 rounded-full items-center justify-center ${activeTab === 'calendar' ? 'bg-white dark:bg-zinc-800' : ''}`}
              style={activeTab === 'calendar' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1.5, elevation: 2 } : undefined}
            >
              <Text className={`text-sm font-semibold ${activeTab === 'calendar' ? 'text-black dark:text-white' : 'text-zinc-400'}`}>
                Calendar Events
              </Text>
            </Pressable>
          </View>

          {/* Task Engine Views */}
          {tasksLoading ? (
            <View className="items-center py-12 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900">
              <Text className="text-[14px] text-zinc-400 dark:text-zinc-500">Loading tasks...</Text>
            </View>
          ) : needsMoodCheck ? (
            <View className="items-center py-10 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 px-6">
              <Text className="text-3xl mb-2">👋</Text>
              <Text className="text-[15px] font-semibold text-black dark:text-white text-center">Let's check in first!</Text>
              <Text className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-1 text-center leading-5">
                Log your energy level above to synchronize your daily workflows.
              </Text>
            </View>
          ) : topLevelTasks.length === 0 && !energyLoading ? (
            <View className="items-center py-12 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900">
              <Text className="text-3xl mb-2">🎉</Text>
              <Text className="text-[15px] font-semibold text-black dark:text-white">All caught up!</Text>
              <Text className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-1">No tasks for now. Enjoy your day!</Text>
            </View>
          ) : (
            <>
              {topLevelTasks.map((task) => renderTaskCard(task))}

              <Pressable
                className="mt-2 mb-4 flex-row items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black py-3.5 active:opacity-70"
                onPress={() => { setShowMicTooltip(false); navigation.navigate('AllTasks'); }}
              >
                <Text className="text-[15px] font-semibold text-[#007AFF] mr-1">View All Tasks</Text>
                <ChevronRight size={15} color="#007AFF" strokeWidth={2.5} />
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>

      {/* ─── Premium AI Voice Brain Dump Floating Action Button (FAB) ─── */}
      <View className="absolute bottom-6 right-6" pointerEvents="box-none">
        {/* Tooltip with arrow */}
        {showMicTooltip && (
          <View style={{ position: 'absolute', bottom: 68, right: -4, alignItems: 'flex-end', zIndex: 10 }}>
            <View style={{
              backgroundColor: isDark ? '#1C1C1E' : '#1C1C1E',
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 10,
              shadowColor: '#007AFF',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 10,
              borderWidth: 1,
              borderColor: 'rgba(0,122,255,0.3)',
              minWidth: 180,
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                🎙️ Add tasks using voice
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '400', textAlign: 'center', marginTop: 2 }}>
                Tap to brain dump your tasks
              </Text>
            </View>
            {/* Arrow pointing down to mic */}
            <View style={{
              width: 0,
              height: 0,
              borderLeftWidth: 8,
              borderRightWidth: 8,
              borderTopWidth: 10,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: '#1C1C1E',
              marginRight: 22,
              marginTop: -1,
            }} />
          </View>
        )}

        {/* Animated pulse ring behind mic button */}
        {showMicTooltip && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: 28,
              backgroundColor: 'rgba(0,122,255,0.18)',
              transform: [{ scale: pulseAnim }],
            }}
          />
        )}

        <Pressable
          onPress={() => {
            setShowMicTooltip(false);
            setIsBrainDumpVisible(true);
          }}
          className="h-14 w-14 items-center justify-center rounded-full bg-[#007AFF]"
          style={{
            shadowColor: '#007AFF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: showMicTooltip ? 0.5 : 0.3,
            shadowRadius: showMicTooltip ? 12 : 6,
            elevation: showMicTooltip ? 12 : 8,
          }}
        >
          <Mic size={22} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </View>

      {renderMoodCheckModal()}
      {renderConsentPopup()}
      
      <BrainDumpModal
        isVisible={isBrainDumpVisible}
        onClose={() => setIsBrainDumpVisible(false)}
        onSave={(text: string) => fetchMoodlog()}
      />
      <CreateTaskModal
        isVisible={isCreateTaskVisible}
        onClose={() => setIsCreateTaskVisible(false)}
        onSave={() => fetchMoodlog()}
      />
    </SafeAreaView>
  );
};

export default DashboardScreen;