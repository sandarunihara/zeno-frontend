import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  const buttonStyle: ViewStyle = {
    backgroundColor: isDisabled
      ? theme.buttonDisabled
      : isPrimary
      ? theme.button
      : 'transparent',
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: isPrimary ? theme.shadow : 'transparent',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: isPrimary ? 0 : 1.5,
    borderColor: isPrimary ? 'transparent' : theme.button,
  };

  const textStyleComputed: TextStyle = {
    color: isPrimary ? theme.buttonText : theme.button,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[buttonStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? theme.buttonText : theme.button} />
      ) : (
        <Text style={[textStyleComputed, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
