import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View, Pressable, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Clock, AlertTriangle, CheckCircle2, Edit3, Save, X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { dashboardApi, Task, TaskDetailResponse, ManualTaskRequest } from '../../api/dashboardApi';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const TaskDetailScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { taskId } = route.params;

  const [loading, setLoading] = useState(true);
  const [taskDetail, setTaskDetail] = useState<TaskDetailResponse | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());
  const [editForm, setEditForm] = useState<ManualTaskRequest>({
    title: '',
    description: '',
    effortLevel: 'Medium',
    deadline: '',
    isCritical: false,
    status: 'PENDING'
  });

  const fetchDetail = async () => {
    try {
      const response = await dashboardApi.getTaskById(taskId);
      setTaskDetail(response);
      if (response.task) {
        let defaultDate = '';
        let defaultTime = '';
        if (response.task.deadline) {
          try {
            const parts = response.task.deadline.split('T');
            if (parts.length === 2) {
              defaultDate = parts[0];
              defaultTime = parts[1].substring(0, 5); 
            } else {
              defaultDate = response.task.deadline;
            }
          } catch(e) {}
        }
        
        setEditDate(defaultDate);
        setEditTime(defaultTime);
        let dObj = new Date();
        if (defaultDate) {
          const t = defaultTime || '00:00';
          const parsed = new Date(`${defaultDate}T${t}:00`);
          if (!isNaN(parsed.getTime())) {
            dObj = parsed;
          }
        }
        setDateObj(dObj);

        setEditForm({
          title: response.task.title,
          description: response.task.description || '',
          effortLevel: response.task.effort_level,
          deadline: response.task.deadline || '',
          isCritical: response.task.is_critical,
          status: response.task.status
        });
      }
    } catch (error) {
      console.error("Failed to fetch task detail", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [taskId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { ...editForm };
      
      const d = editDate.trim();
      const t = editTime.trim();

      if (d && t) {
        payload.deadline = `${d}T${t}:00`;
      } else if (d) {
        payload.deadline = `${d}T00:00:00`;
      } else {
        payload.deadline = null;
      }
      
      await dashboardApi.updateTask(taskId, payload);
      setIsEditing(false);
      await fetchDetail(); // Refresh data
    } catch (error) {
      console.error("Failed to update task", error);
    } finally {
      setSaving(false);
    }
  };

  const isUrgent = (deadline?: string | null) => {
    if (!deadline) return false;
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return diff > 0 && diff <= 48 * 60 * 60 * 1000;
  };

  const formatDeadline = (deadline?: string | null) => {
    if (!deadline) return 'No Deadline';
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return deadline; // return raw if invalid date
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderEffortBadge = (effort: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      Low: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-300' },
      Medium: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-300' },
      High: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600 dark:text-red-300' },
    };
    const c = colors[effort] ?? colors.Medium;

    return (
      <View className={`rounded-full px-3 py-1 ${c.bg}`}>
        <Text className={`text-xs font-bold uppercase tracking-wide ${c.text}`}>{effort} Effort</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View className="flex-row items-center px-6 pt-4 pb-2">
          <Pressable onPress={() => navigation.goBack()} className="mr-3 p-2 -ml-2 rounded-full active:bg-zinc-100 dark:active:bg-zinc-800">
            <ArrowLeft size={24} color={theme.text} />
          </Pressable>
        </View>
        <ActivityIndicator size="large" color="#5E5CE6" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!taskDetail || !taskDetail.task) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View className="flex-row items-center px-6 pt-4 pb-2">
          <Pressable onPress={() => navigation.goBack()} className="mr-3 p-2 -ml-2 rounded-full active:bg-zinc-100 dark:active:bg-zinc-800">
            <ArrowLeft size={24} color={theme.text} />
          </Pressable>
        </View>
        <View className="items-center py-10">
          <Text className="text-zinc-500 dark:text-zinc-400">Task not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { task, microSteps, parentTask } = taskDetail;
  const urgent = isUrgent(task.deadline);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <View className="flex-row items-center">
          <Pressable onPress={() => {
            if (isEditing) setIsEditing(false);
            else navigation.goBack();
          }} className="mr-3 p-2 -ml-2 rounded-full active:bg-zinc-100 dark:active:bg-zinc-800">
            {isEditing ? <X size={24} color={theme.text} /> : <ArrowLeft size={24} color={theme.text} />}
          </Pressable>
          <Text className="text-xl font-bold text-zinc-900 dark:text-white" numberOfLines={1}>
            {isEditing ? 'Edit Task' : 'Task Detail'}
          </Text>
        </View>
        <Pressable 
          onPress={isEditing ? handleSave : () => setIsEditing(true)}
          disabled={saving}
          className={`flex-row items-center gap-2 rounded-full px-4 py-2 ${isEditing ? 'bg-[#5E5CE6]' : 'bg-zinc-100 dark:bg-zinc-800'} active:opacity-70`}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : isEditing ? (
            <>
              <Save size={16} color="#FFF" />
              <Text className="font-bold text-white text-sm">Save</Text>
            </>
          ) : (
            <>
              <Edit3 size={16} color={isDark ? '#A1A1AA' : '#52525B'} />
              <Text className="font-bold text-zinc-600 dark:text-zinc-300 text-sm">Edit</Text>
            </>
          )}
        </Pressable>
      </View>
      
      <ScrollView className="flex-1 px-6 pt-6 pb-10" showsVerticalScrollIndicator={false}>
        {!isEditing && parentTask && (
          <View className="mb-4 self-start rounded-md bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
            <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Part of: {parentTask.title}
            </Text>
          </View>
        )}

        {isEditing ? (
          <View className="mb-6 space-y-4 gap-4">
            <View>
              <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">TITLE</Text>
              <TextInput
                value={editForm.title}
                onChangeText={(t) => setEditForm({ ...editForm, title: t })}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                placeholder="Task Title"
                placeholderTextColor={isDark ? '#71717A' : '#A1A1AA'}
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">DESCRIPTION</Text>
              <TextInput
                value={editForm.description}
                onChangeText={(t) => setEditForm({ ...editForm, description: t })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white min-h-[80px]"
                placeholder="Description"
                placeholderTextColor={isDark ? '#71717A' : '#A1A1AA'}
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">DEADLINE</Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 justify-center"
                >
                  <Text className={editDate ? "text-base text-zinc-900 dark:text-white" : "text-base text-zinc-400 dark:text-zinc-600"}>
                    {editDate || "YYYY-MM-DD"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowTimePicker(true)}
                  className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 justify-center"
                >
                  <Text className={editTime ? "text-base text-zinc-900 dark:text-white" : "text-base text-zinc-400 dark:text-zinc-600"}>
                    {editTime || "HH:MM"}
                  </Text>
                </Pressable>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={dateObj}
                  mode="date"
                  display="default"
                  onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDateObj(selectedDate);
                      setEditDate(selectedDate.toISOString().split('T')[0]);
                    }
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={dateObj}
                  mode="time"
                  display="default"
                  onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                    setShowTimePicker(false);
                    if (selectedDate) {
                      setDateObj(selectedDate);
                      setEditTime(selectedDate.toISOString().split('T')[1].substring(0, 5));
                    }
                  }}
                />
              )}
            </View>

            <View>
              <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">EFFORT LEVEL</Text>
              <View className="flex-row gap-2">
                {['Low', 'Medium', 'High'].map(level => (
                  <Pressable
                    key={level}
                    onPress={() => setEditForm({ ...editForm, effortLevel: level })}
                    className={`flex-1 items-center justify-center rounded-lg py-2 border ${editForm.effortLevel === level ? 'border-[#5E5CE6] bg-[#5E5CE6]/10' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'}`}
                  >
                    <Text className={`text-sm font-semibold ${editForm.effortLevel === level ? 'text-[#5E5CE6]' : 'text-zinc-500 dark:text-zinc-400'}`}>{level}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="flex-row items-center justify-between mt-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <View>
                <Text className="text-sm font-bold text-zinc-900 dark:text-white">Critical Task</Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">Mark as high priority / critical</Text>
              </View>
              <Switch
                value={editForm.isCritical}
                onValueChange={(v) => setEditForm({ ...editForm, isCritical: v })}
                trackColor={{ false: isDark ? '#3F3F46' : '#E4E4E7', true: '#5E5CE6' }}
              />
            </View>

            <View className="flex-row items-center justify-between mt-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <View>
                <Text className="text-sm font-bold text-zinc-900 dark:text-white">Status</Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">Current progress state</Text>
              </View>
              <Pressable
                onPress={() => setEditForm({ ...editForm, status: editForm.status === 'PENDING' ? 'COMPLETED' : 'PENDING' })}
                className={`px-3 py-1.5 rounded-full ${editForm.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}
              >
                <Text className={`text-xs font-bold ${editForm.status === 'COMPLETED' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  {editForm.status}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row gap-2">
                {renderEffortBadge(task.effort_level)}
                <View className={`rounded-full px-3 py-1 ${task.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
                  <Text className={`text-xs font-bold uppercase tracking-wide ${task.status === 'COMPLETED' ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>
                    {task.status}
                  </Text>
                </View>
              </View>
              {task.is_critical && (
                <View className="flex-row items-center gap-1 rounded-full bg-red-500/10 px-3 py-1">
                  <AlertTriangle size={14} color="#EF4444" />
                  <Text className="text-xs font-bold text-red-500">Critical</Text>
                </View>
              )}
            </View>

            <Text className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 leading-8">
              {task.title}
            </Text>

            <View className="flex-row items-center gap-2 mb-6">
              {urgent ? <AlertTriangle size={14} color={isDark ? '#FCA5A5' : '#EF4444'} /> : <Clock size={14} color={isDark ? '#A1A1AA' : '#71717A'} />}
              <Text className={['text-sm font-medium', urgent ? 'text-red-600 dark:text-red-300' : 'text-zinc-500 dark:text-zinc-400'].join(' ')}>
                {formatDeadline(task.deadline)}
              </Text>
            </View>

            {task.description && (
              <View className="mb-8 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <Text className="text-[15px] leading-6 text-zinc-700 dark:text-zinc-300">
                  {task.description}
                </Text>
              </View>
            )}

            {!parentTask && microSteps && microSteps.length > 0 && (
              <View className="mb-8">
                <Text className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Micro Steps</Text>
                <View className="gap-3">
                  {microSteps.map((step) => (
                    <View key={step.id} className="flex-row items-start gap-3 rounded-xl border border-zinc-100 bg-white p-3.5 dark:border-zinc-800 dark:bg-black shadow-sm">
                      <CheckCircle2 size={20} color={isDark ? '#52525B' : '#E4E4E7'} />
                      <View className="flex-1 pt-0.5">
                        <Text className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200 mb-1">{step.title}</Text>
                        {step.description && (
                          <Text className="text-xs text-zinc-500 dark:text-zinc-400 leading-4">{step.description}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TaskDetailScreen;
