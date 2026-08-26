import React, { memo, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { AuthUser } from '@/types';

export type ProfileDrawerAction =
  | 'listings'
  | 'favorites'
  | 'settings';

type ProfileDrawerProps = {
  user: AuthUser | null;
  onNavigate?: (action: ProfileDrawerAction) => void;
  onLogout?: () => void;
};

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'Hesabım';
  return cleaned.replace(/(^|\s)\S/g, (s) => s.toLocaleUpperCase('tr'));
}

function initialsFromEmail(email: string): string {
  const name = nameFromEmail(email);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toLocaleUpperCase('tr');
  }
  return name.slice(0, 2).toLocaleUpperCase('tr') || 'H';
}

const NAV: {
  key: ProfileDrawerAction;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'listings', label: 'İlanlarım', icon: 'grid-outline' },
  { key: 'favorites', label: 'Favoriler', icon: 'heart-outline' },
  { key: 'settings', label: 'Ayarlar', icon: 'settings-outline' },
];

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  muted?: boolean;
  chevron?: boolean;
  text: string;
  textMuted: string;
};

function ProfileRow({
  icon,
  label,
  onPress,
  muted,
  chevron = true,
  text,
  textMuted,
}: RowProps) {
  const [hovered, setHovered] = useState(false);
  const color = muted ? textMuted : text;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor:
            hovered || pressed ? 'rgba(12,12,14,0.035)' : 'transparent',
          opacity: pressed ? 0.88 : 1,
          ...Platform.select({
            web: {
              cursor: 'pointer' as const,
              transition: 'background-color 220ms cubic-bezier(0.22,1,0.36,1)',
            },
            default: {},
          }),
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      {chevron ? (
        <Ionicons name="chevron-forward" size={14} color={textMuted} />
      ) : null}
    </Pressable>
  );
}

/** Profil çekmece içeriği — kabuk SideDrawer. */
export const ProfileDrawer = memo(function ProfileDrawer({
  user,
  onNavigate,
  onLogout,
}: ProfileDrawerProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const header = useThemeColor('header');
  const border = useThemeColor('border');

  const identity = useMemo(() => {
    if (!user) {
      return { name: 'Hesabım', initials: 'H', email: '' };
    }
    const full = `${user.firstName} ${user.lastName}`.trim();
    const name = full || nameFromEmail(user.email);
    const initials = full
      ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toLocaleUpperCase(
          'tr'
        )
      : initialsFromEmail(user.email);
    return { name, initials: initials || 'H', email: user.email };
  }, [user]);

  return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >
        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: header }]}>
            <Text style={styles.avatarText}>{identity.initials}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={[styles.name, { color: text }]} numberOfLines={1}>
              {identity.name}
            </Text>
            {identity.email ? (
              <Text style={[styles.email, { color: textMuted }]} numberOfLines={1}>
                {identity.email}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.nav}>
          {NAV.map((item) => (
            <ProfileRow
              key={item.key}
              icon={item.icon}
              label={item.label}
              onPress={() => onNavigate?.(item.key)}
              text={text}
              textMuted={textMuted}
            />
          ))}
        </View>

        <View style={[styles.rule, { backgroundColor: border }]} />

        <ProfileRow
          icon="log-out-outline"
          label="Çıkış yap"
          onPress={() => onLogout?.()}
          muted
          chevron={false}
          text={text}
          textMuted={textMuted}
        />
      </ScrollView>
  );
});

const styles = StyleSheet.create({
  body: {
    paddingTop: 20,
    paddingBottom: Spacing.xl,
    paddingHorizontal: 4,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 8,
    paddingBottom: 24,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 13,
    fontWeight: '400',
  },
  nav: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 48,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.15,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
    marginHorizontal: 10,
  },
});
