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
import { useRouter } from 'expo-router';
import { BrandMark } from '@/components/layout/BrandMark';
import { HomeContentContainer } from '@/components/layout/HomeContentContainer';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

const NAV = [
  { key: 'listings', label: 'İlanlar' },
  { key: 'services', label: 'Hizmetler' },
  { key: 'about', label: 'Hakkımızda' },
  { key: 'support', label: 'Destek' },
  { key: 'privacy', label: 'Gizlilik' },
] as const;

const SOCIAL: { name: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { name: 'logo-instagram', label: 'Instagram' },
  { name: 'logo-facebook', label: 'Facebook' },
  { name: 'logo-youtube', label: 'YouTube' },
];

type SiteFooterProps = {
  onNavPress?: (key: string) => void;
  onPostAdPress?: () => void;
};

/** Footer — header ile aynı siyah bar, genişlik ve tipografi. */
export function SiteFooter({ onNavPress, onPostAdPress }: SiteFooterProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const showPostAdLabel = width >= 640;

  const header = useThemeColor('header');
  const headerMuted = useThemeColor('headerMuted');
  const headerBorder = useThemeColor('headerBorder');

  return (
    <View
      nativeID="haradan-site-footer"
      style={[
        styles.wrap,
        {
          backgroundColor: header,
          borderTopColor: headerBorder,
        },
      ]}
      {...(Platform.OS === 'web'
        ? ({ dataSet: { keepSearch: 'true' } } as object)
        : null)}
    >
      <HomeContentContainer>
        <View style={styles.bar}>
          <View style={[styles.slot, styles.slotLeft]}>
            <Pressable
              onPress={() => router.push('/')}
              accessibilityRole="link"
              accessibilityLabel="Haradan.com ana sayfa"
              hitSlop={6}
              style={({ pressed }) => [
                styles.brandRow,
                { opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <BrandMark variant="light" height={32} />
              <Text style={styles.brand}>Haradan.com</Text>
            </Pressable>
          </View>

          {isWide ? (
            <View style={styles.navOverlay} pointerEvents="box-none">
              <View style={styles.navCenter} accessibilityRole="menubar">
                {NAV.map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => onNavPress?.(item.key)}
                    accessibilityRole="link"
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.navItem,
                      { opacity: pressed ? 0.65 : 1 },
                    ]}
                  >
                    <Text style={[styles.navLabel, { color: headerMuted }]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={[styles.slot, styles.slotRight]}>
            {SOCIAL.map((s) => (
              <Pressable
                key={s.name}
                accessibilityRole="link"
                accessibilityLabel={s.label}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.iconHit,
                  { opacity: pressed ? 0.55 : 1 },
                ]}
              >
                <Ionicons name={s.name} size={16} color={headerMuted} />
              </Pressable>
            ))}
            <Pressable
              onPress={onPostAdPress}
              accessibilityRole="button"
              accessibilityLabel="İlan ver"
              style={({ pressed }) => [
                styles.postAdBtn,
                !showPostAdLabel && styles.postAdBtnCompact,
                {
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  ...Platform.select({
                    web: {
                      boxShadow: pressed
                        ? '0 4px 12px rgba(0,0,0,0.12)'
                        : '0 6px 18px rgba(0,0,0,0.14)',
                      cursor: 'pointer' as const,
                    },
                    default: {},
                  }),
                },
              ]}
            >
              <Ionicons name="add" size={showPostAdLabel ? 17 : 16} color="#0c0c0e" />
              {showPostAdLabel ? (
                <Text style={styles.postAdLabel}>İlan Ver</Text>
              ) : null}
            </Pressable>
          </View>
        </View>

        {!isWide ? (
          <View style={styles.navMobile} accessibilityRole="menubar">
            {NAV.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => onNavPress?.(item.key)}
                hitSlop={4}
                style={({ pressed }) => [
                  styles.navMobileItem,
                  { opacity: pressed ? 0.65 : 1 },
                ]}
              >
                <Text style={[styles.navMobileLabel, { color: headerMuted }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={[styles.copyRow, { borderTopColor: headerBorder }]}>
          <Text style={[styles.copy, { color: headerMuted }]}>
            © {new Date().getFullYear()} Haradan.com
          </Text>
        </View>
      </HomeContentContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  slot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  slotLeft: {
    justifyContent: 'flex-start',
  },
  slotRight: {
    justifyContent: 'flex-end',
    gap: 2,
  },
  navOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  navCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brand: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  navItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  navMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
    paddingTop: 4,
    paddingBottom: 2,
  },
  navMobileItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  navMobileLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  iconHit: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    minHeight: 38,
    marginLeft: 4,
  },
  postAdBtnCompact: {
    paddingHorizontal: 10,
    minWidth: 38,
  },
  postAdLabel: {
    ...Typography.small,
    fontWeight: '700',
    color: '#0c0c0e',
    letterSpacing: 0.1,
  },
  copyRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  copy: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
});
