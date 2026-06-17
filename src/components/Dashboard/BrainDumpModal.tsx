import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Mic, Square, X, Brain, AlertCircle, Keyboard as KeyboardIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { dashboardApi } from '../../api/dashboardApi';

interface BrainDumpModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave?: (text: string) => void;
}

const BrainDumpModal: React.FC<BrainDumpModalProps> = ({ isVisible, onClose, onSave }) => {
  const { isDark } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [displayText, setDisplayText] = useState('');

  // Ref always mirrors the latest displayText so event handlers never have stale closures
  const displayTextRef = useRef('');
  
  // Accumulate completed speech segments from previous sessions
  const completedSegmentsRef = useRef<string[]>([]);
  // The current in-progress segment
  const currentSegmentRef = useRef('');

  const [error, setError] = useState<string | null>(null);
  const [useKeyboard, setUseKeyboard] = useState(false);
  const [debugLog, setDebugLog] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const wantsToRecord = useRef(false);
  const sessionCountRef = useRef(0);

  // Helper: sync the ref → state (call after every ref mutation)
  const flush = useCallback(() => {
    setDisplayText(displayTextRef.current);
  }, []);

  // ─── Stop helper ────────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    wantsToRecord.current = false;
    try { ExpoSpeechRecognitionModule.stop(); } catch (_) {}
    setIsRecording(false);

    // Commit any in-progress segment before stopping
    const finalSegment = currentSegmentRef.current.trim();
    if (finalSegment) {
      completedSegmentsRef.current.push(finalSegment);
    }
    currentSegmentRef.current = '';

    const completedText = completedSegmentsRef.current.filter(Boolean).join(' ');
    displayTextRef.current = completedText;
    flush();
  }, [flush]);

  // Cleanup when modal hides
  useEffect(() => {
    if (!isVisible) stopRecording();
  }, [isVisible, stopRecording]);

  // ─── Start helper ───────────────────────────────────────────────────────────
  const startRecognition = useCallback(() => {
    if (!wantsToRecord.current) return;
    sessionCountRef.current += 1;
    setDebugLog(`session #${sessionCountRef.current} — listening`);
    try {
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,   // get partial results as user speaks
        continuous: false,
        requiresOnDeviceRecognition: false, // allow cloud fallback for better accuracy
        addsPunctuation: false,
        androidIntentOptions: {
          EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 15000,           // wait up to 15s for speech to start
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,   // 2s silence = done speaking
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
        },
      });
    } catch (e: any) {
      console.error('[BD] start error:', e.message);
      setError('Could not start microphone: ' + e.message);
      wantsToRecord.current = false;
      setIsRecording(false);
    }
  }, []);

  // Single restart gate — prevents double-starts from concurrent event firings
  const restartScheduled = useRef(false);

  const scheduleRestart = useCallback((delayMs = 400) => {
    if (!wantsToRecord.current || restartScheduled.current) return;
    restartScheduled.current = true;
    setTimeout(() => {
      restartScheduled.current = false;
      if (wantsToRecord.current) startRecognition();
    }, delayMs);
  }, [startRecognition]);

  // ─── Native event hooks ──────────────────────────────────────────────────────

  useSpeechRecognitionEvent('start', () => {
    setDebugLog('started ✓ — speak now');
    setIsRecording(true);
  });

  useSpeechRecognitionEvent('audiostart', () => {
    setDebugLog('audio captured ✓ — speak now');
  });

  useSpeechRecognitionEvent('speechstart', () => {
    setDebugLog('speech detected ✓');
  });

  useSpeechRecognitionEvent('result', (event) => {
    // Concatenate all results in the current session
    const sessionText = (event.results ?? [])
      .map(r => r.transcript)
      .join('');
    
    setDebugLog('result ✓ isFinal=' + event.isFinal + ' text="' + sessionText + '"');
    currentSegmentRef.current = sessionText;

    // Build the full text by appending current segment to completed segments
    const completedText = completedSegmentsRef.current.filter(Boolean).join(' ');
    const trimmedSessionText = sessionText.trim();
    const fullText = completedText && trimmedSessionText
      ? (completedText + ' ' + trimmedSessionText)
      : (completedText || trimmedSessionText);

    displayTextRef.current = fullText;
    flush();
  });

  useSpeechRecognitionEvent('nomatch', () => {
    setDebugLog('no match');
    // Let 'end' handle restart
  });

  useSpeechRecognitionEvent('end', () => {
    setDebugLog(prev => prev + ' | ended');

    // Commit any in-progress segment to the completed list
    const finalSegment = currentSegmentRef.current.trim();
    if (finalSegment) {
      completedSegmentsRef.current.push(finalSegment);
    }
    currentSegmentRef.current = '';

    const completedText = completedSegmentsRef.current.filter(Boolean).join(' ');
    displayTextRef.current = completedText;
    flush();

    // Single restart point for all normal session endings
    scheduleRestart(400);
    if (!wantsToRecord.current) setIsRecording(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    const code = event.error;
    console.warn('[BD] error:', code, event.message);
    setDebugLog('error: ' + code);

    if (code === 'aborted') {
      // User stopped — do nothing, end event will clean up
      return;
    }

    if (code === 'no-speech' || code === 'speech-timeout' || code === 'network') {
      // Normal session timeout — let 'end' event handle the restart
      // (end always fires after error, so scheduleRestart will be called there)
      return;
    }

    // Real fatal errors
    setError(`Voice error (${code}). Try the keyboard instead.`);
    wantsToRecord.current = false;
    setIsRecording(false);
  });

  // ─── Toggle ──────────────────────────────────────────────────────────────────
  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
      setError(null);
      setDebugLog('requesting permission...');
      setUseKeyboard(false);
      try {
        const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!perm.granted) {
          setError('Microphone permission denied. Go to Settings → Apps → Zeno → Permissions.');
          return;
        }
        wantsToRecord.current = true;
        setIsRecording(true);
        startRecognition();
      } catch (e: any) {
        setError(e.message || 'Failed to start recording');
      }
    }
  }, [isRecording, stopRecording, startRecognition]);

  const handleClose = useCallback(() => {
    stopRecording();
    onClose();
  }, [stopRecording, onClose]);

  const handleSave = useCallback(async () => {
    const text = displayText.trim();
    if (!text) return;

    setIsSaving(true);
    setError(null);
    try {
      const response = await dashboardApi.createTaskFromTranscript(text);
      if (response.success) {
        if (onSave) {
          onSave(text);
        }
        handleClose();
      } else {
        setError(response.message || 'Failed to save thought to tasks.');
      }
    } catch (err: any) {
      console.error('[BrainDumpModal] save error:', err);
      setError(err.message || 'An error occurred while saving your thought.');
    } finally {
      setIsSaving(false);
    }
  }, [displayText, onSave, handleClose]);


  return (
    <Modal visible={isVisible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="h-[80%] w-full rounded-t-[32px] bg-white p-6 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">

          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/30">
                <Brain size={20} color="#5E5CE6" />
              </View>
              <View>
                <Text className="text-xl font-bold text-zinc-900 dark:text-white">Brain Dump</Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isRecording ? '🔴 Speak now...' : 'Capture your thoughts instantly'}
                </Text>
              </View>
            </View>
            <Pressable onPress={handleClose} className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <X size={20} color={isDark ? '#A1A1AA' : '#71717A'} />
            </Pressable>
          </View>

          {/* Debug strip — visible always so we can see what's happening */}
          {debugLog !== '' && (
            <View className="mb-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2">
              <Text className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">{debugLog}</Text>
            </View>
          )}

          {/* Error */}
          {error && (
            <View className="mb-4 flex-row items-center gap-2 rounded-xl bg-rose-50 p-3 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30">
              <AlertCircle size={16} color="#E11D48" />
              <Text className="flex-1 text-[12px] font-medium text-rose-700 dark:text-rose-400">{error}</Text>
            </View>
          )}

          {/* Input Area */}
          <View className="flex-1 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-4 mb-6 border border-zinc-100 dark:border-zinc-800">
            {useKeyboard ? (
              <TextInput
                multiline
                placeholder="Start typing your thought..."
                placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                value={displayText}
                onChangeText={(t) => {
                  displayTextRef.current = t;
                  completedSegmentsRef.current = [t];
                  currentSegmentRef.current = '';
                  setDisplayText(t);
                }}
                className="text-lg leading-7 text-zinc-800 dark:text-zinc-200 text-left align-top flex-1"
                autoFocus
              />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {!displayText ? (
                  <Text className="text-center text-zinc-400 dark:text-zinc-500 mt-10">
                    {isRecording ? 'Speak clearly into the microphone...' : 'Tap the microphone and start speaking...'}
                  </Text>
                ) : (
                  <Text className="text-lg leading-7 text-zinc-800 dark:text-zinc-200">
                    {displayText}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>

          {/* Controls */}
          <View className="items-center mb-6">
            <View className="flex-row items-center gap-8">
              <Pressable
                onPress={() => { setUseKeyboard(v => !v); if (isRecording) stopRecording(); }}
                className={['h-12 w-12 items-center justify-center rounded-full', useKeyboard ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-zinc-100 dark:bg-zinc-800'].join(' ')}
              >
                <KeyboardIcon size={20} color={useKeyboard ? '#5E5CE6' : (isDark ? '#71717A' : '#94A3B8')} />
              </Pressable>

              <View className="items-center justify-center">
                {isRecording && <View className="absolute h-28 w-28 rounded-full bg-rose-200/40 dark:bg-rose-950/40" />}
                <Pressable
                  onPress={handleToggleRecording}
                  className={['h-20 w-20 items-center justify-center rounded-full shadow-lg', isRecording ? 'bg-rose-500' : 'bg-[#5E5CE6]'].join(' ')}
                >
                  {isRecording
                    ? <Square size={28} color="white" fill="white" />
                    : <Mic size={28} color="white" strokeWidth={2.5} />}
                </Pressable>
              </View>

              <Pressable
                onPress={() => {
                  completedSegmentsRef.current = [];
                  currentSegmentRef.current = '';
                  displayTextRef.current = '';
                  setDisplayText('');
                }}
                className="h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
              >
                <Text className="text-[10px] font-bold text-zinc-400 uppercase">Clear</Text>
              </Pressable>
            </View>
            <Text className={['mt-3 font-bold tracking-[1.5px] uppercase text-[10px]', isRecording ? 'text-rose-500' : 'text-[#5E5CE6]'].join(' ')}>
              {isRecording ? 'Listening...' : (useKeyboard ? 'Keyboard Mode' : 'Voice Mode')}
            </Text>
          </View>

          {/* Save */}
          <Pressable
            onPress={handleSave}
            disabled={!displayText.trim() || isSaving}
            className={[
              'w-full rounded-2xl py-4 active:opacity-90 shadow-sm flex-row justify-center items-center',
              (displayText.trim() && !isSaving) ? 'bg-[#5E5CE6]' : 'bg-zinc-200 dark:bg-zinc-800'
            ].join(' ')}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className={['text-center font-bold', displayText.trim() ? 'text-white' : 'text-zinc-400 dark:text-zinc-600'].join(' ')}>
                Save Thought
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default BrainDumpModal;
