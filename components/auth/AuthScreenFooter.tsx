import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuthLayout } from './AuthLayoutContext';
import { useAuthTheme } from './AuthThemeContext';

type AuthScreenFooterProps = {
  prompt: string;
  actionLabel: string;
  href: '/auth/login' | '/auth/signup';
};

export function AuthScreenFooter({
  prompt,
  actionLabel,
  href,
}: AuthScreenFooterProps) {
  const { tokens } = useAuthTheme();
  const { isGlass } = useAuthLayout();

  return (
    <View
      style={[
        styles.wrap,
        isGlass ? styles.wrapGlass : { borderTopColor: tokens.divider },
      ]}
    >
      <Text style={[styles.prompt, { color: tokens.textSecondary }]}>
        {prompt}{' '}
      </Text>
      <Link href={href} asChild>
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          style={({ pressed }) => [pressed ? { opacity: 0.7 } : null]}
        >
          <Text style={[styles.action, { color: tokens.primary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.lg,
    marginTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  wrapGlass: {
    borderTopWidth: 0,
    paddingTop: Spacing.md,
    marginTop: 0,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginHorizontal: -Spacing.lg,
    marginBottom: -Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  prompt: {
    ...Typography.body,
  },
  action: {
    ...Typography.body,
    fontWeight: '700',
    ...Platform.select({
      web: { cursor: 'pointer' as const },
      default: {},
    }),
  },
});
