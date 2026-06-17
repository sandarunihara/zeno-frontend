import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, ChevronDown, ChevronRight, Circle, Clock, ArrowLeft, Plus } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { dashboardApi, Task } from '../../api/dashboardApi';
import { useNavigation } from '@react-navigation/native';
import CreateTaskModal from '../../components/Dashboard/CreateTaskModal';

const AllTasksScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedTasks, setCheckedTasks] = useState<Record<number, boolean>>({});
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});
  const [isCreateTaskVisible, setIsCreateTaskVisible] = useState(false);

  const fetchTasks = async () => {
    try {
      const allTasks = await dashboardApi.getAllTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error("Failed to fetch all tasks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

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

  const isUrgent = (deadline?: string | null) => {
    if (!deadline) return false;
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return diff > 0 && diff <= 48 * 60 * 60 * 1000;
  };

  const formatDeadline = (deadline?: string | null) => {
    if (!deadline) return null;
    const d = new Date(deadline);
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderCheck = (checked: boolean) => (
    <View
      className={[
        'h-[22px] w-[22px] items-center justify-center rounded-full border-[1.6px]',
        checked ? 'border-[#5E5CE6] bg-[#5E5CE6]' : 'border-zinc-300 dark:border-zinc-700',
      ].join(' ')}
    >
      {checked ? <Text className="text-[11px] font-bold text-white leading-[13px]">✓</Text> : null}
    </View>
  );

  const renderDeadlineBadge = (deadline?: string | null) => {
    const label = formatDeadline(deadline);
    if (!label) return null;
    const urgent = isUrgent(deadline);

    return (
      <View className={['mt-1.5 flex-row items-center gap-1 self-start rounded-full px-2.5 py-1', urgent ? 'bg-red-50 dark:bg-red-950/30' : 'bg-zinc-100 dark:bg-zinc-800/60'].join(' ')}>
        {urgent ? <AlertTriangle size={11} color={isDark ? '#FCA5A5' : '#EF4444'} strokeWidth={2.2} /> : <Clock size={11} color={isDark ? '#A1A1AA' : '#71717A'} strokeWidth={2.2} />}
        <Text className={['text-[11px] font-semibold', urgent ? 'text-red-600 dark:text-red-300' : 'text-zinc-500 dark:text-zinc-400'].join(' ')}>
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

  const renderTaskCard = (task: Task) => {
    const hasMicro = task.microSteps && task.microSteps.length > 0;
    const checked = !!checkedTasks[task.id];
    const expanded = !!expandedTasks[task.id];

    return (
      <View
        key={task.id}
        className="mb-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3.5 dark:border-zinc-900 dark:bg-black"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }}
      >
        <Pressable
          className="flex-row items-start gap-3 flex-1"
          onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
        >
          <View className="pt-0.5">
            <Pressable hitSlop={8} onPress={(e) => { e.stopPropagation(); if (hasMicro) toggleParentChecked(task); else toggleTaskChecked(task.id); }}>
              {renderCheck(checked)}
            </Pressable>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className={['flex-1 text-base font-semibold', checked ? 'text-zinc-400 line-through dark:text-zinc-600' : 'text-zinc-900 dark:text-white'].join(' ')}>
                {task.title}
              </Text>
              {task.is_critical && (
                <View className="rounded-full bg-red-500/10 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-red-500">!</Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center gap-2 flex-wrap">
              {renderDeadlineBadge(task.deadline)}
              <View className="mt-1.5">{renderEffortBadge(task.effort_level)}</View>
            </View>
          </View>
        </Pressable>
        {hasMicro ? (
          <Pressable 
            className="absolute right-4 top-4 p-2 -m-2 rounded-full" 
            onPress={() => toggleExpanded(task.id)}
            hitSlop={8}
          >
            {expanded ? <ChevronDown size={18} color={isDark ? '#71717A' : '#94A3B8'} strokeWidth={2} /> : <ChevronRight size={18} color={isDark ? '#71717A' : '#94A3B8'} strokeWidth={2} />}
          </Pressable>
        ) : null}
        {hasMicro && expanded && task.microSteps ? (
          <View className="mt-3 ml-[14px] gap-2.5 border-l border-zinc-100 pl-3 dark:border-zinc-800">
            {task.microSteps.map((step) => {
              const stepChecked = !!checkedTasks[step.id];
              return (
                <Pressable
                  key={step.id}
                  className="flex-row items-start gap-3"
                  onPress={() => navigation.navigate('TaskDetail', { taskId: step.id })}
                >
                  <View className="pt-0.5">
                    <Pressable hitSlop={8} onPress={(e) => { e.stopPropagation(); toggleMicroStep(task, step.id); }}>
                      {renderCheck(stepChecked)}
                    </Pressable>
                  </View>
                  <View className="flex-1">
                    <Text className={['text-sm font-medium', stepChecked ? 'text-zinc-400 line-through dark:text-zinc-600' : 'text-zinc-600 dark:text-zinc-300'].join(' ')}>{step.title}</Text>
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

  const pendingCount = tasks.filter((t) => !checkedTasks[t.id]).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <View className="flex-row items-center px-6 pt-4 pb-2">
        <Pressable onPress={() => navigation.goBack()} className="mr-3 p-2 -ml-2 rounded-full active:bg-zinc-100 dark:active:bg-zinc-800">
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text className="text-2xl font-bold text-zinc-900 dark:text-white flex-1">All Tasks</Text>
        <Pressable 
          onPress={() => setIsCreateTaskVisible(true)}
          className="h-8 w-8 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40"
        >
          <Plus size={16} color="#5E5CE6" strokeWidth={2.5} />
        </Pressable>
      </View>
      <ScrollView className="flex-1 px-6 pt-2 pb-10" showsVerticalScrollIndicator={false}>
        <View className="mb-4">
          <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {loading ? 'Loading tasks...' : `${pendingCount} ${pendingCount === 1 ? 'task' : 'tasks'} pending`}
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#5E5CE6" style={{ marginTop: 40 }} />
        ) : tasks.length === 0 ? (
          <View className="items-center py-10">
            <Text className="text-zinc-500 dark:text-zinc-400">No tasks found.</Text>
          </View>
        ) : (
          tasks.map(renderTaskCard)
        )}
      </ScrollView>
      <CreateTaskModal
        isVisible={isCreateTaskVisible}
        onClose={() => setIsCreateTaskVisible(false)}
        onSave={fetchTasks}
      />
    </SafeAreaView>
  );
};

export default AllTasksScreen;
