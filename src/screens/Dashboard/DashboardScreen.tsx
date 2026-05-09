import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronDown, ChevronRight, Circle, Clock, Mic, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { dashboardApi, Task } from '../../api/dashboardApi';
import BrainDumpModal from '../../components/Dashboard/BrainDumpModal';

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

/** Format an ISO-8601 deadline string into a human-friendly label */
const formatDeadline = (deadline?: string | null): string | null => {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();

  // Today / Tomorrow helpers
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

const DashboardScreen: React.FC = () => {
  const { isDark } = useTheme();
  const [energyScore, setEnergyScore] = useState<number | null>(null);
  const [energyLoading, setEnergyLoading] = useState(true);
  const [needsMoodCheck, setNeedsMoodCheck] = useState(false);
  const [askConsent, setAskConsent] = useState(false);
  const [keepItLight, setKeepItLight] = useState<boolean | null>(null);
  const [empatheticMessage, setEmpatheticMessage] = useState<string | null>(null);

  // Real tasks from the API
  const [displayTasks, setDisplayTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [isBrainDumpVisible, setIsBrainDumpVisible] = useState(false);
  const [lastThought, setLastThought] = useState<string | null>(null);

  // Track checked state per task id
  const [checkedTasks, setCheckedTasks] = useState<Record<number, boolean>>({});

  // Track which parent tasks are expanded
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});

  /** Store dashboard response data into state */
  const applyDashboardData = useCallback((data: { displayTasks: Task[]; empatheticMessage: string; askConsent: boolean }) => {
    setDisplayTasks(data.displayTasks ?? []);
    setEmpatheticMessage(data.empatheticMessage ?? null);
    // Auto-expand tasks that have micro steps
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

  useEffect(() => {
    const fetchMoodlog = async () => {
      try {
        const response = await dashboardApi.getMoodlog();
        if (response.success && response.moodLog) {
          setEnergyScore(response.moodLog.energyScore);
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
          setTasksLoading(true);
          const dashboardData = await dashboardApi.getDashboardTasks();
          applyDashboardData(dashboardData);
          setTasksLoading(false);
        } else {
          setNeedsMoodCheck(true);
        }
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
        setTasksLoading(true);
        const dashboardData = await dashboardApi.getDashboardTasks(isLight);
        applyDashboardData(dashboardData);
        setTasksLoading(false);
        console.log("Updated Tasks based on consent:", dashboardData);
      }else {
        console.warn("Failed to update moodlog with consent choice, response:", response);
      }
      
    } catch (error) {
      console.error("Failed to fetch tasks after consent", error);
    }
  };

  // ─── Toggle helpers ───────────────────────────────────────────────

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
      // Auto-check parent if all micro-steps are checked
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

  // ─── Render helpers ───────────────────────────────────────────────

  const renderCheck = (checked: boolean) => (
    <View
      className={[
        'h-[22px] w-[22px] items-center justify-center rounded-full border-[1.6px]',
        checked
          ? 'border-[#5E5CE6] bg-[#5E5CE6]'
          : 'border-zinc-300 dark:border-zinc-700',
      ].join(' ')}
    >
      {checked ? (
        <Text className="text-[11px] font-bold text-white leading-[13px]">✓</Text>
      ) : null}
    </View>
  );

  const renderDeadlineBadge = (deadline?: string | null) => {
    const label = formatDeadline(deadline);
    if (!label) return null;

    const urgent = isUrgent(deadline);

    return (
      <View
        className={[
          'mt-1.5 flex-row items-center gap-1 self-start rounded-full px-2.5 py-1',
          urgent
            ? 'bg-red-50 dark:bg-red-950/30'
            : 'bg-zinc-100 dark:bg-zinc-800/60',
        ].join(' ')}
      >
        {urgent ? (
          <AlertTriangle size={11} color={isDark ? '#FCA5A5' : '#EF4444'} strokeWidth={2.2} />
        ) : (
          <Clock size={11} color={isDark ? '#A1A1AA' : '#71717A'} strokeWidth={2.2} />
        )}
        <Text
          className={[
            'text-[11px] font-semibold',
            urgent
              ? 'text-red-600 dark:text-red-300'
              : 'text-zinc-500 dark:text-zinc-400',
          ].join(' ')}
        >
          {label}
        </Text>
      </View>
    );
  };

  const renderEffortBadge = (effort: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      Low: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-300' },
      Medium: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-300' },
      High: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600 dark:text-red-300' },
    };
    const c = colors[effort] ?? colors.Medium;

    return (
      <View className={`rounded-full px-2 py-0.5 ${c.bg}`}>
        <Text className={`text-[10px] font-bold uppercase tracking-wide ${c.text}`}>{effort}</Text>
      </View>
    );
  };

  /** Render a single task card — handles both parent tasks with micro-steps and simple tasks */
  const renderTaskCard = (task: Task) => {
    const hasMicro = task.microSteps && task.microSteps.length > 0;
    const checked = !!checkedTasks[task.id];
    const expanded = !!expandedTasks[task.id];

    return (
      <View
        key={task.id}
        className="mb-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3.5 dark:border-zinc-900 dark:bg-black"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
        {/* Main task row */}
        <Pressable
          className="flex-row items-start gap-3"
          onPress={() => {
            if (hasMicro) {
              toggleExpanded(task.id);
            } else {
              toggleTaskChecked(task.id);
            }
          }}
          android_ripple={{ color: isDark ? '#27272a' : '#f4f4f5' }}
        >
          <View className="pt-0.5">
            <Pressable
              className="rounded-full"
              hitSlop={8}
              onPress={(e) => {
                e.stopPropagation();
                if (hasMicro) {
                  toggleParentChecked(task);
                } else {
                  toggleTaskChecked(task.id);
                }
              }}
            >
              {renderCheck(checked)}
            </Pressable>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text
                className={[
                  'flex-1 text-base font-semibold',
                  checked
                    ? 'text-zinc-400 line-through dark:text-zinc-600'
                    : 'text-zinc-900 dark:text-white',
                ].join(' ')}
              >
                {task.title}
              </Text>
              {task.is_critical && (
                <View className="rounded-full bg-red-500/10 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-red-500">!</Text>
                </View>
              )}
            </View>

            {/* Deadline + effort row */}
            <View className="flex-row items-center gap-2 flex-wrap">
              {renderDeadlineBadge(task.deadline)}
              <View className="mt-1.5">
                {renderEffortBadge(task.effort_level)}
              </View>
            </View>
          </View>

          {hasMicro ? (
            expanded ? (
              <ChevronDown size={18} color={isDark ? '#71717A' : '#94A3B8'} strokeWidth={2} />
            ) : (
              <ChevronRight size={18} color={isDark ? '#71717A' : '#94A3B8'} strokeWidth={2} />
            )
          ) : (
            <Circle size={16} color="transparent" />
          )}
        </Pressable>

        {/* Micro-steps */}
        {hasMicro && expanded && task.microSteps ? (
          <View className="mt-3 ml-[14px] gap-2.5 border-l border-zinc-100 pl-3 dark:border-zinc-800">
            {task.microSteps.map((step) => {
              const stepChecked = !!checkedTasks[step.id];
              return (
                <Pressable
                  key={step.id}
                  className="flex-row items-start gap-3"
                  onPress={() => toggleMicroStep(task, step.id)}
                  android_ripple={{ color: isDark ? '#27272a' : '#f4f4f5' }}
                >
                  <View className="pt-0.5">
                    {renderCheck(stepChecked)}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={[
                        'text-sm font-medium',
                        stepChecked
                          ? 'text-zinc-400 line-through dark:text-zinc-600'
                          : 'text-zinc-600 dark:text-zinc-300',
                      ].join(' ')}
                    >
                      {step.title}
                    </Text>
                    {renderDeadlineBadge(step.deadline)}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    );
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

  // Separate top-level tasks (no parentTaskId) — micro-steps are nested inside their parent
  const topLevelTasks = displayTasks.filter((t) => !t.parentTaskId);

  // Count pending tasks
  const pendingCount = topLevelTasks.filter((t) => !checkedTasks[t.id]).length;

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

          {/* Summary card */}
          <View className="mt-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-black">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-zinc-400 dark:text-zinc-500">Today</Text>
              <View className="rounded-full bg-indigo-50 px-3 py-1 dark:bg-indigo-950/40">
                <Text className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">Focus Mode</Text>
              </View>
            </View>
            <Text className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              {empatheticMessage
                ? empatheticMessage
                : tasksLoading
                  ? 'Loading your tasks...'
                  : `${pendingCount} task${pendingCount !== 1 ? 's' : ''} remaining today.`}
            </Text>
          </View>

          {/* Brain Dump */}
          <View className="mt-8 items-center justify-center">
            <View className="h-[156px] w-[156px] items-center justify-center rounded-full bg-[rgba(94,92,230,0.10)] dark:bg-[rgba(94,92,230,0.18)]">
              <Pressable
                className="h-[112px] w-[112px] items-center justify-center rounded-full border border-indigo-100 bg-white dark:border-zinc-900 dark:bg-zinc-950"
                onPress={() => setIsBrainDumpVisible(true)}
                android_ripple={{ color: isDark ? '#312e81' : '#eef2ff', radius: 60 }}
              >
                <Mic size={34} color={ACCENT} strokeWidth={2.1} />
              </Pressable>
            </View>
            <Text className="mt-3 text-xs font-bold tracking-[2.2px] text-[#5E5CE6]">
              BRAIN DUMP
            </Text>
            {lastThought && (
              <View className="mt-4 px-10">
                <Text className="text-center text-sm italic text-zinc-500 dark:text-zinc-400">
                  "{lastThought}"
                </Text>
              </View>
            )}
          </View>

          {/* ─── Tasks Section ────────────────────────────────────── */}
          <View className="mb-2 mt-9 flex-row items-center justify-between">
            <Text className="text-[11px] font-bold tracking-[1.3px] text-zinc-400 dark:text-zinc-500">
              YOUR TASKS
            </Text>
            <Text className="text-[11px] font-semibold tracking-[1.1px] text-zinc-400 dark:text-zinc-500">
              {pendingCount} pending
            </Text>
          </View>

          {tasksLoading ? (
            <View className="items-center py-10">
              <Text className="text-sm text-zinc-400 dark:text-zinc-500">Loading tasks...</Text>
            </View>
          ) : topLevelTasks.length === 0 && !needsMoodCheck && !energyLoading ? (
            <View className="items-center py-10 rounded-2xl border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-black">
              <Text className="text-3xl mb-2">🎉</Text>
              <Text className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">All caught up!</Text>
              <Text className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">No tasks for now. Enjoy your day!</Text>
            </View>
          ) : (
            topLevelTasks.map((task) => renderTaskCard(task))
          )}
        </ScrollView>

      </View>
      {renderConsentPopup()}
      <BrainDumpModal
        isVisible={isBrainDumpVisible}
        onClose={() => setIsBrainDumpVisible(false)}
        onSave={(text: string) => setLastThought(text)}
      />
    </SafeAreaView>
  );
};

export default DashboardScreen;
