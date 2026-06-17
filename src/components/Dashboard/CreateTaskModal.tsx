import React, { useState, useCallback } from 'react';
import { Modal, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Switch, ScrollView } from 'react-native';
import { CheckSquare, X, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { dashboardApi } from '../../api/dashboardApi';

interface CreateTaskModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isVisible, onClose, onSave }) => {
  const { isDark } = useTheme();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [effortLevel, setEffortLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [isCritical, setIsCritical] = useState(false);
  const [deadline, setDeadline] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setTitle('');
    setDescription('');
    setEffortLevel('Medium');
    setIsCritical(false);
    setDeadline('');
    setError(null);
    onClose();
  }, [onClose]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      const response = await dashboardApi.createManualTask({
        title: title.trim(),
        description: description.trim() || undefined,
        effortLevel,
        isCritical,
        status: 'Pending',
        deadline: deadline.trim() ? new Date(deadline).toISOString() : null,
      });

      if (response.success) {
        if (onSave) onSave();
        handleClose();
      } else {
        setError(response.message || 'Failed to create task.');
      }
    } catch (err: any) {
      console.error('[CreateTaskModal] save error:', err);
      setError(err.message || 'An error occurred while creating the task.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="h-[85%] w-full rounded-t-[32px] bg-white p-6 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">

          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/30">
                <CheckSquare size={20} color="#5E5CE6" />
              </View>
              <View>
                <Text className="text-xl font-bold text-zinc-900 dark:text-white">Create Task</Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">Add a new manual task</Text>
              </View>
            </View>
            <Pressable onPress={handleClose} className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <X size={20} color={isDark ? '#A1A1AA' : '#71717A'} />
            </Pressable>
          </View>

          {/* Error */}
          {error && (
            <View className="mb-4 flex-row items-center gap-2 rounded-xl bg-rose-50 p-3 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30">
              <AlertCircle size={16} color="#E11D48" />
              <Text className="flex-1 text-[12px] font-medium text-rose-700 dark:text-rose-400">{error}</Text>
            </View>
          )}

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Title <Text className="text-rose-500">*</Text></Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What needs to be done?"
                placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-base text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-white"
              />
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Additional details..."
                multiline
                numberOfLines={3}
                placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-base text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-white text-left align-top"
              />
            </View>

            {/* Effort Level */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Effort Level</Text>
              <View className="flex-row gap-3">
                {(['Low', 'Medium', 'High'] as const).map(level => (
                  <Pressable
                    key={level}
                    onPress={() => setEffortLevel(level)}
                    className={['flex-1 items-center rounded-xl py-3 border', effortLevel === level ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400' : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50'].join(' ')}
                  >
                    <Text className={['font-medium', effortLevel === level ? 'text-indigo-600 dark:text-indigo-300' : 'text-zinc-600 dark:text-zinc-400'].join(' ')}>{level}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Deadline */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Deadline (Optional)</Text>
              <TextInput
                value={deadline}
                onChangeText={setDeadline}
                placeholder="e.g. 2026-06-20T15:00:00"
                placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-base text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-white"
              />
            </View>

            {/* Is Critical */}
            <View className="mb-6 flex-row items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
              <View>
                <Text className="text-base font-semibold text-zinc-900 dark:text-white">Critical Task</Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">Mark this task as high priority</Text>
              </View>
              <Switch
                value={isCritical}
                onValueChange={setIsCritical}
                trackColor={{ false: isDark ? '#3F3F46' : '#E4E4E7', true: '#5E5CE6' }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className={[
              'w-full rounded-2xl py-4 mt-2 active:opacity-90 shadow-sm flex-row justify-center items-center',
              isSaving ? 'bg-indigo-400' : 'bg-[#5E5CE6]'
            ].join(' ')}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-center font-bold text-white">Create Task</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateTaskModal;
