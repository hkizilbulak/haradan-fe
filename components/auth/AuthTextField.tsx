import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuthTheme } from './AuthThemeContext';

type AuthTextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null;
  rightIcon?: 'eye' | 'eye-off' | null;
  onRightIconPress?: () => void;
};

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const FIELD_RADIUS = 8;

export function AuthTextField({
  label,
  error,
  rightIcon,
  onRightIconPress,
  onFocus,
  onBlur,
  ...inputProps
}: AuthTextFieldProps) {
  const { tokens } = useAuthTheme();
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 240,
      easing: EASE,
      useNativeDriver: false,
    }).start();
  }, [focused, focusAnim]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? tokens.error : tokens.border,
      error ? tokens.error : tokens.borderFocus,
    ],
  });

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: tokens.text }]}>{label}</Text>
      <Animated.View
        style={[
          styles.field,
          {
            borderColor,
            backgroundColor: tokens.surface,
            ...Platform.select({
              web: {
                boxShadow: focused
                  ? '0 4px 16px rgba(15, 23, 42, 0.04)'
                  : 'none',
              },
              default: {},
            }),
          },
        ]}
      >
        <TextInput
          {...inputProps}
          placeholderTextColor={tokens.textMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: tokens.text }]}
          accessibilityLabel={label}
        />
        {rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={
              rightIcon === 'eye' ? 'Show password' : 'Hide password'
            }
            style={({ pressed }) => [
              styles.iconBtn,
              pressed ? { opacity: 0.6 } : null,
            ]}
          >
            <Ionicons
              name={rightIcon === 'eye' ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={tokens.textMuted}
            />
          </Pressable>
        ) : null}
      </Animated.View>
      {error ? (
        <Text style={[styles.error, { color: tokens.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.small,
    fontWeight: '600',
  },
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: FIELD_RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  iconBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  error: {
    ...Typography.caption,
  },
});
