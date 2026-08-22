import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuthTheme } from './AuthThemeContext';

type AuthSubmitButtonProps = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary';
};

export function AuthSubmitButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
  variant = 'primary',
}: AuthSubmitButtonProps) {
  const { tokens } = useAuthTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  const onPressIn = () => {
    if (isDisabled) return;
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          transform: [{ scale }],
          opacity: isDisabled ? 0.55 : 1,
          ...Platform.select({
            web: isPrimary ? { boxShadow: `0 10px 28px ${tokens.glow}` } : {},
            default: {},
          }),
        },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={({ pressed }) => [
          styles.pressable,
          isPrimary
            ? {
                backgroundColor:
                  pressed && !isDisabled ? tokens.primaryDark : tokens.primary,
              }
            : {
                backgroundColor: pressed && !isDisabled ? tokens.accentSoft : tokens.surface,
                borderWidth: 1.5,
                borderColor: tokens.border,
              },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isPrimary ? '#fff' : tokens.primary} size="small" />
        ) : (
          <Text
            style={[
              styles.label,
              { color: isPrimary ? '#ffffff' : tokens.text },
            ]}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pressable: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  label: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
