import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuthTheme } from './AuthThemeContext';

type AuthCheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
};

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

export function AuthCheckbox({ label, checked, onChange }: AuthCheckboxProps) {
  const { tokens } = useAuthTheme();
  const anim = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: checked ? 1 : 0,
      duration: 200,
      easing: EASE,
      useNativeDriver: false,
    }).start();
  }, [checked, anim]);

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [tokens.checkboxBorder, tokens.primary],
  });

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', tokens.primary],
  });

  const checkScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed ? { opacity: 0.85 } : null]}
    >
      <Animated.View
        style={[
          styles.box,
          { borderColor, backgroundColor: bgColor },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: checkScale }], opacity: anim }}>
          <Ionicons name="checkmark" size={11} color="#fff" />
        </Animated.View>
      </Animated.View>
      <Text style={[styles.label, { color: tokens.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.small,
  },
});
