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
import { useAuthLayout } from './AuthLayoutContext';
import { useAuthTheme } from './AuthThemeContext';

type AuthTextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: 'eye' | 'eye-off' | null;
  onRightIconPress?: () => void;
};

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const FIELD_RADIUS = 12;
const FIELD_HEIGHT = 52;

export function AuthTextField({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onFocus,
  onBlur,
  ...inputProps
}: AuthTextFieldProps) {
  const { tokens } = useAuthTheme();
  const { isGlass } = useAuthLayout();
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
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

  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isGlass ? 'rgba(255,255,255,0.52)' : tokens.surface,
      isGlass ? 'rgba(255,255,255,0.72)' : tokens.accentSoft,
    ],
  });

  const fieldBorder = isGlass
    ? error
      ? tokens.error
      : focused
        ? 'rgba(243,71,112,0.55)'
        : 'rgba(255,255,255,0.65)'
    : undefined;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: tokens.text }]}>{label}</Text>
      <Animated.View
        style={[
          styles.field,
          {
            borderColor: fieldBorder ?? borderColor,
            backgroundColor: bgColor,
            minHeight: isGlass ? 48 : FIELD_HEIGHT,
          },
        ]}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={20}
            color={focused ? tokens.primary : tokens.textMuted}
            style={styles.leftIcon}
          />
        ) : null}
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
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={
              rightIcon === 'eye' ? 'Parolayı göster' : 'Parolayı gizle'
            }
            style={({ pressed }) => [
              styles.iconBtn,
              pressed ? { opacity: 0.6 } : null,
            ]}
          >
            <Ionicons
              name={rightIcon === 'eye' ? 'eye-outline' : 'eye-off-outline'}
              size={22}
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
    gap: 6,
  },
  label: {
    ...Typography.small,
    fontWeight: '600',
    marginLeft: 2,
  },
  field: {
    borderWidth: 1.5,
    borderRadius: FIELD_RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontSize: 16,
    paddingVertical: Platform.OS === 'web' ? 14 : 12,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  iconBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  error: {
    ...Typography.caption,
    marginLeft: 2,
  },
});
