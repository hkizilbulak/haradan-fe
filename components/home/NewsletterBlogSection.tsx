import React, { memo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { BlogVideoItem } from '@/types';

type NewsletterBlogSectionProps = {
  videos: BlogVideoItem[];
  onSubscribe?: (email: string) => void;
  onVideoPress?: (id: string) => void;
  onViewAll?: () => void;
};

const SOCIAL: { name: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { name: 'logo-instagram', label: 'Instagram' },
  { name: 'logo-facebook', label: 'Facebook' },
  { name: 'logo-youtube', label: 'YouTube' },
  { name: 'paper-plane-outline', label: 'Telegram' },
];

/** Bülten + editoryal kartlar — çerçevesiz, premium. */
export const NewsletterBlogSection = memo(function NewsletterBlogSection({
  videos,
  onSubscribe,
  onVideoPress,
  onViewAll,
}: NewsletterBlogSectionProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);

  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const textMuted = useThemeColor('textMuted');
  const header = useThemeColor('header');
  const skeleton = useThemeColor('skeleton');

  return (
    <View style={styles.wrap}>
      <View style={[styles.inner, !isWide && styles.innerMobile]}>
        <View style={[styles.news, !isWide && styles.newsMobile]}>
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

        <View style={[styles.videos, !isWide && styles.videosMobile]}>
          {videos.map((v) => (
            <Pressable
              key={v.id}
              onPress={() => onVideoPress?.(v.id)}
              accessibilityRole="button"
              accessibilityLabel={v.title}
              style={({ pressed }) => [
                styles.videoRow,
                {
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.992 : 1 }],
                  ...Platform.select({
                    web: {
                      cursor: 'pointer' as const,
                      transition:
                        'transform 200ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease',
                    },
                    default: {},
                  }),
                },
              ]}
            >
              <View style={styles.thumbWrap}>
                <Image
                  source={v.coverUrl}
                  style={[styles.thumb, { backgroundColor: skeleton }]}
                  contentFit="cover"
                  transition={240}
                  priority="low"
                  cachePolicy="memory-disk"
                />
                <View style={styles.play}>
                  <Ionicons name="play" size={11} color="#fff" />
                </View>
              </View>
              <View style={styles.videoCopy}>
                <View style={styles.videoMeta}>
                  {v.tag ? (
                    <Text style={[styles.tag, { color: textMuted }]}>{v.tag}</Text>
                  ) : null}
                  <Text style={[styles.duration, { color: textMuted }]}>
                    {v.duration}
                  </Text>
                </View>
                <Text style={[styles.videoTitle, { color: text }]} numberOfLines={2}>
                  {v.title}
                </Text>
              </View>
            </Pressable>
          ))}
          <Pressable
            onPress={onViewAll}
            accessibilityRole="button"
            accessibilityLabel="Tümünü gör"
            style={({ pressed }) => [
              styles.viewAllBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[styles.viewAll, { color: textMuted }]}>Tümünü gör</Text>
            <Ionicons name="chevron-forward" size={14} color={textMuted} />
          </Pressable>
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
  inner: {
    flexDirection: 'row',
    gap: Spacing['2xl'],
    alignItems: 'center',
  },
  innerMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: Spacing.xl,
  },
  news: {
    flex: 1,
    gap: 10,
    maxWidth: 460,
  },
  newsMobile: {
    width: '100%',
    maxWidth: '100%',
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
  videos: {
    flex: 1.05,
    gap: 14,
  },
  videosMobile: {
    width: '100%',
  },
  videoRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  thumbWrap: {
    width: 112,
    height: 76,
    borderRadius: 18,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  play: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(12,12,14,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 1,
  },
  videoCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  duration: {
    ...Typography.caption,
    fontWeight: '500',
  },
  videoTitle: {
    ...Typography.small,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.15,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
  },
});
