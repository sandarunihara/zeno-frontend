import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface InputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  disabled?: boolean;
  error?: string;
  label?: string;
  style?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  disabled = false,
  error,
  label,
  style,
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  const containerStyle: ViewStyle = {
    marginBottom: 16,
    width: '100%',
  };

  const labelStyle: TextStyle = {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.input,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: error ? theme.error : isFocused ? theme.button : theme.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: 0,
  };

  const textInputStyle: TextStyle = {
    flex: 1,
    fontSize: 16,
    color: theme.text,
    paddingVertical: 12,
  };

  const errorStyle: TextStyle = {
    fontSize: 12,
    color: theme.error,
    marginTop: 6,
  };

  return (
    <View style={[containerStyle, style]}>
      {label && <Text style={labelStyle}>{label}</Text>}
      <View style={inputContainerStyle}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={textInputStyle}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={{ color: theme.textSecondary, fontSize: 24, paddingHorizontal: 8 }}>
              {showPassword ? '👁' : '👁‍🗨'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={errorStyle}>{error}</Text>}
    </View>
  );
};
