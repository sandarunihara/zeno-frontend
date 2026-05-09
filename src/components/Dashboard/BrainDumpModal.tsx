import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Mic, Square, X, Brain, AlertCircle, Keyboard as KeyboardIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";

interface BrainDumpModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave?: (text: string) => void;
}

const BrainDumpModal: React.FC<BrainDumpModalProps> = ({ isVisible, onClose, onSave }) => {
  const { isDark } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [partialText, setPartialText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [useKeyboard, setUseKeyboard] = useState(false);

  // Track whether the user WANTS to be recording (vs. system stopping it)
  const wantsToRecord = React.useRef(false);

  // Check availability
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        if (!ExpoSpeechRecognitionModule) {
          setIsAvailable(false);
          setUseKeyboard(true);
          return;
        }

        if (typeof ExpoSpeechRecognitionModule.isSpeechRecognitionAvailable === 'function') {
          const available = await ExpoSpeechRecognitionModule.isSpeechRecognitionAvailable();
          setIsAvailable(available);
          if (!available) setUseKeyboard(true);
        } else if (typeof ExpoSpeechRecognitionModule.start === 'function') {
          setIsAvailable(true);
        } else {
          setIsAvailable(false);
          setUseKeyboard(true);
        }
      } catch (e: any) {
        setIsAvailable(false);
        setUseKeyboard(true);
      }
    };

    if (isVisible) {
      checkAvailability();
    }
  }, [isVisible]);

  // Helper to start speech recognition
  const startListening = useCallback(() => {
    if (!ExpoSpeechRecognitionModule) return;
    try {
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: true, // Keep listening continuously
      });
    } catch (e: any) {
      console.error("[BrainDump] Failed to start:", e.message);
    }
  }, []);

  // Event handlers
  useSpeechRecognitionEvent("start", () => setIsRecording(true));

  // When the recognizer ends, auto-restart if user still wants to record
  useSpeechRecognitionEvent("end", () => {
    if (wantsToRecord.current) {
      // Small delay before restarting to avoid rapid loops
      setTimeout(() => {
        if (wantsToRecord.current) {
          startListening();
        }
      }, 300);
    } else {
      setIsRecording(false);
    }
  });

  // Handle errors — auto-restart on "no-speech", show real errors otherwise
  useSpeechRecognitionEvent("error", (event: any) => {
    const errorCode = event?.error;
    if (errorCode === "no-speech" && wantsToRecord.current) {
      // Silence detected — just restart, don't show error
      setTimeout(() => {
        if (wantsToRecord.current) {
          startListening();
        }
      }, 300);
    } else if (wantsToRecord.current) {
      // Real error — stop recording
      console.error("Speech recognition error:", errorCode, event?.message);
      setError(event?.message || "An error occurred");
      wantsToRecord.current = false;
      setIsRecording(false);
    }
  });

  useSpeechRecognitionEvent("result", (event: any) => {
    if (event?.results && event.results.length > 0) {
      const transcript = event.results[0].transcript;
      if (event.isFinal) {
        setRecognizedText(prev => (prev ? prev + " " : "") + transcript);
        setPartialText('');
      } else {
        setPartialText(transcript);
      }
    }
  });

  const handleToggleRecording = useCallback(async () => {
    if (!isAvailable || !ExpoSpeechRecognitionModule) return;

    if (isRecording) {
      // User pressed STOP
      wantsToRecord.current = false;
      ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
    } else {
      // User pressed START
      setUseKeyboard(false);
      setError(null);
      try {
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!result.granted) {
          setError("Microphone permission denied");
          return;
        }
        wantsToRecord.current = true;
        startListening();
      } catch (e: any) {
        setError(e.message || "Failed to start recording");
      }
    }
  }, [isRecording, isAvailable, startListening]);

  const handleClose = useCallback(async () => {
    wantsToRecord.current = false;
    if (isRecording && isAvailable && ExpoSpeechRecognitionModule) {
      ExpoSpeechRecognitionModule.stop();
    }
    setIsRecording(false);
    onClose();
  }, [isRecording, isAvailable, onClose]);

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="h-[80%] w-full rounded-t-[32px] bg-white p-6 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/30">
                <Brain size={20} color="#5E5CE6" />
              </View>
              <View>
                <Text className="text-xl font-bold text-zinc-900 dark:text-white">Brain Dump</Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">Capture your thoughts instantly</Text>
              </View>
            </View>
            <Pressable onPress={handleClose} className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <X size={20} color={isDark ? '#A1A1AA' : '#71717A'} />
            </Pressable>
          </View>

          {/* Warning */}
          {!isAvailable && (
            <View className="mb-4 flex-row items-center gap-2 rounded-xl bg-amber-50 p-3 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
              <AlertCircle size={16} color="#D97706" />
              <Text className="flex-1 text-[12px] font-medium text-amber-700 dark:text-amber-400">
                Voice not detected. Try restarting the app or rebuilding.
              </Text>
            </View>
          )}

          {/* Input Area */}
          <View className="flex-1 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-4 mb-6 border border-zinc-100 dark:border-zinc-800">
            {useKeyboard ? (
              <TextInput
                multiline
                placeholder="Start typing your thought..."
                placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                value={recognizedText}
                onChangeText={setRecognizedText}
                className="text-lg leading-7 text-zinc-800 dark:text-zinc-200 text-left align-top flex-1"
                autoFocus={!isAvailable}
              />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {!recognizedText && !partialText && !isRecording ? (
                  <Text className="text-center text-zinc-400 dark:text-zinc-500 mt-10">
                    Tap the microphone and start speaking...
                  </Text>
                ) : (
                  <Text className="text-lg leading-7 text-zinc-800 dark:text-zinc-200">
                    {recognizedText.trim()}
                    {partialText && <Text className="text-zinc-400 dark:text-zinc-500"> {partialText}</Text>}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>

          {/* Controls */}
          <View className="items-center mb-6">
            <View className="flex-row items-center gap-8">
              {isAvailable && (
                <Pressable
                  onPress={() => setUseKeyboard(!useKeyboard)}
                  className={["h-12 w-12 items-center justify-center rounded-full", useKeyboard ? "bg-indigo-100 dark:bg-indigo-900/50" : "bg-zinc-100 dark:bg-zinc-800"].join(" ")}
                >
                  <KeyboardIcon size={20} color={useKeyboard ? "#5E5CE6" : (isDark ? '#71717A' : '#94A3B8')} />
                </Pressable>
              )}

              <View className="items-center justify-center">
                {isRecording && (
                  <View className="absolute h-28 w-28 rounded-full bg-indigo-200/40 dark:bg-indigo-950/40 animate-pulse" />
                )}
                <Pressable
                  onPress={handleToggleRecording}
                  disabled={!isAvailable}
                  className={["h-20 w-20 items-center justify-center rounded-full shadow-lg", !isAvailable ? "bg-zinc-300 dark:bg-zinc-700" : (isRecording ? "bg-rose-500" : "bg-[#5E5CE6]")].join(" ")}
                >
                  {isRecording ? <Square size={28} color="white" fill="white" /> : <Mic size={28} color="white" strokeWidth={2.5} />}
                </Pressable>
              </View>

              <Pressable
                onPress={() => { setRecognizedText(''); setPartialText(''); }}
                className="h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
              >
                <Text className="text-[10px] font-bold text-zinc-400 uppercase">Clear</Text>
              </Pressable>
            </View>
            <Text className={["mt-3 font-bold tracking-[1.5px] uppercase text-[10px]", isRecording ? "text-rose-500" : "text-[#5E5CE6]"].join(" ")}>
              {isRecording ? "Listening..." : (isAvailable ? (useKeyboard ? "Keyboard Mode" : "Voice Mode") : "Keyboard Only")}
            </Text>
          </View>

          {/* Save Action */}
          <Pressable
            onPress={() => {
              if (recognizedText.trim() && onSave) onSave(recognizedText.trim());
              handleClose();
            }}
            disabled={!recognizedText.trim()}
            className={["w-full rounded-2xl py-4 active:opacity-90 shadow-sm", recognizedText.trim() ? "bg-[#5E5CE6]" : "bg-zinc-200 dark:bg-zinc-800"].join(" ")}
          >
            <Text className={["text-center font-bold", recognizedText.trim() ? "text-white" : "text-zinc-400 dark:text-zinc-600"].join(" ")}>
              Save Thought
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default BrainDumpModal;
