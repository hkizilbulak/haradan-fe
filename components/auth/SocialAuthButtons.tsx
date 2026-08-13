import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuthTheme } from './AuthThemeContext';

type Provider = {
  key: 'google' | 'facebook' | 'apple';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const PROVIDERS: Provider[] = [
  { key: 'google', label: 'Google', icon: 'logo-google', color: '#ea4335' },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877f2' },
  { key: 'apple', label: 'Apple', icon: 'logo-apple', color: '#111111' },
];

type SocialAuthButtonsProps = {
  onPress?: (provider: Provider['key']) => void;
};

export function SocialAuthButtons({ onPress }: SocialAuthButtonsProps) {
  const { width } = useWindowDimensions();
  const showLabels = width >= 360;
  const { tokens } = useAuthTheme();

  return (
    <View style={styles.row}>
      {PROVIDERS.map((p) => (
        <Pressable
          key={p.key}
          onPress={() => onPress?.(p.key)}
          accessibilityRole="button"
          accessibilityLabel={`Continue with ${p.label}`}
          style={({ pressed }) => [
            styles.btn,
            {
              borderColor: tokens.border,
              backgroundColor: tokens.surface,
              opacity: pressed ? 0.88 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              ...Platform.select({
                web: {
                  cursor: 'pointer' as const,
                  transition: 'transform 200ms ease, opacity 200ms ease',
                },
                default: {},
              }),
            },
          ]}
        >
          <Ionicons name={p.icon} size={17} color={p.color} />
          {showLabels ? (
            <Text style={[styles.label, { color: tokens.text }]} numberOfLines={1}>
              {p.label}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btn: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
  },
  label: {
    ...Typography.small,
    fontWeight: '600',
  },
});
