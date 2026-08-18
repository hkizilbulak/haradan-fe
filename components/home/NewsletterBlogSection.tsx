import React, { memo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type NewsletterBlogSectionProps = {
  onSubscribe?: (email: string) => void;
};

const SOCIAL: { name: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { name: 'logo-instagram', label: 'Instagram' },
  { name: 'logo-facebook', label: 'Facebook' },
  { name: 'logo-youtube', label: 'YouTube' },
  { name: 'paper-plane-outline', label: 'Telegram' },
];

/** Bülten — çerçevesiz, premium. */
export const NewsletterBlogSection = memo(function NewsletterBlogSection({
  onSubscribe,
}: NewsletterBlogSectionProps) {
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);

  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const textMuted = useThemeColor('textMuted');
  const header = useThemeColor('header');

  return (
    <View style={styles.wrap}>
      <View style={styles.news}>
        <Text style={[styles.eyebrow, { color: textMuted }]}>BÜLTEN</Text>
        <Text style={[styles.heading, { color: text }]}>
          Yeni ilanlardan haberdar ol
        </Text>
        <Text style={[styles.sub, { color: textSecondary }]}>
          Satılık atlar, hizmetler ve aşım fırsatlarını e-postana gönderelim.
        </Text>

        <View
          style={[
            styles.form,
            focused && styles.formFocused,
            { backgroundColor: 'rgba(15,23,42,0.04)' },
          ]}
        >
          <TextInput
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="E-posta adresin"
            placeholderTextColor={textMuted}
            accessibilityLabel="E-posta"
            style={[styles.input, { color: text }]}
          />
          <Pressable
            onPress={() => onSubscribe?.(email.trim())}
            accessibilityRole="button"
            accessibilityLabel="Abone ol"
            style={({ pressed }) => [
              styles.subscribe,
              {
                backgroundColor: header,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Text style={styles.subscribeText}>Abone ol</Text>
          </Pressable>
        </View>

        <View style={styles.social}>
          {SOCIAL.map((item) => (
            <Pressable
              key={item.name}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.socialBtn,
                { opacity: pressed ? 0.55 : 1 },
              ]}
            >
              <Ionicons name={item.name} size={16} color={textMuted} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: Spacing['2xl'],
    marginBottom: Spacing.md,
  },
  news: {
    gap: 10,
    maxWidth: 460,
  },
  eyebrow: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  sub: {
    ...Typography.body,
    lineHeight: 22,
    marginBottom: 6,
  },
  form: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
    minHeight: 56,
  },
  formFocused: {
    ...Platform.select({
      web: {
        boxShadow: '0 8px 28px rgba(15,23,42,0.06)',
      },
      default: {},
    }),
  },
  input: {
    flex: 1,
    minHeight: 40,
    fontSize: 14,
    ...Platform.select({
      web: { outlineStyle: 'none' } as object,
      default: {},
    }),
  },
  subscribe: {
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  social: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  socialBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
