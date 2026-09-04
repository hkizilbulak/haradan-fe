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
  | 'settings'
  | 'post'
  | 'support';

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

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  hasDivider?: boolean;
  destructive?: boolean;
  text: string;
  textMuted: string;
  border: string;
};

function MenuItem({
  icon,
  label,
  onPress,
  hasDivider = false,
  destructive = false,
  text,
  textMuted,
  border,
}: MenuItemProps) {
  const [hovered, setHovered] = useState(false);
  const iconColor = destructive ? '#f43f5e' : text;
  const labelColor = destructive ? '#f43f5e' : text;

  return (
    <View style={styles.itemWrapper}>
      <Pressable
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor:
              hovered || pressed ? 'rgba(255,255,255,0.035)' : 'transparent',
            opacity: pressed ? 0.8 : 1,
            ...Platform.select({
              web: {
                cursor: 'pointer' as const,
                transition: 'background-color 150ms ease',
              },
              default: {},
            }),
          },
        ]}
      >
        <View style={styles.iconSlot}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={destructive ? '#f43f5e' : textMuted}
          style={styles.chevron}
        />
      </Pressable>
      {hasDivider ? (
        <View style={[styles.divider, { backgroundColor: border }]} />
      ) : null}
    </View>
  );
}

/** Profil içeriği — sade, minimalist ve estetik görünüm */
export const ProfileDrawer = memo(function ProfileDrawer({
  user,
  onNavigate,
  onLogout,
}: ProfileDrawerProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');

  const identity = useMemo(() => {
    if (!user) {
      return { name: 'Hesabım', initials: 'H', email: '' };
    }
    const full = `${user.firstName} ${user.lastName}`.trim();
    const name = full || nameFromEmail(user.email);
    const initials = full
      ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toLocaleUpperCase('tr')
      : initialsFromEmail(user.email);
    return { name, initials: initials || 'H', email: user.email };
  }, [user]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.body}
    >
      {/* ─── Minimalist Profil Başlığı ─── */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.avatarText, { color: text }]}>{identity.initials}</Text>
        </View>
        <Text style={[styles.name, { color: text }]} numberOfLines={1}>
          {identity.name}
        </Text>
        {identity.email ? (
          <Text style={[styles.email, { color: textMuted }]} numberOfLines={1}>
            {identity.email}
          </Text>
        ) : null}
      </View>

      {/* ─── Grup 1: İlan & Favoriler ─── */}
      <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
        <MenuItem
          icon="grid-outline"
          label="İlanlarım"
          onPress={() => onNavigate?.('listings')}
          hasDivider
          text={text}
          textMuted={textMuted}
          border={border}
        />
        <MenuItem
          icon="heart-outline"
          label="Favoriler"
          onPress={() => onNavigate?.('favorites')}
          hasDivider
          text={text}
          textMuted={textMuted}
          border={border}
        />
        <MenuItem
          icon="add-circle-outline"
          label="Yeni İlan Ver"
          onPress={() => onNavigate?.('post')}
          text={text}
          textMuted={textMuted}
          border={border}
        />
      </View>

      {/* ─── Grup 2: Ayarlar ─── */}
      <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
        <MenuItem
          icon="settings-outline"
          label="Ayarlar"
          onPress={() => onNavigate?.('settings')}
          text={text}
          textMuted={textMuted}
          border={border}
        />
      </View>

      {/* ─── Grup 3: Çıkış ─── */}
      <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
        <MenuItem
          icon="log-out-outline"
          label="Çıkış Yap"
          onPress={() => onLogout?.()}
          destructive
          text={text}
          textMuted={textMuted}
          border={border}
        />
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  body: {
    paddingTop: 10,
    paddingBottom: Spacing.xl + 24,
    paddingHorizontal: 16,
    gap: 16,
  },
  // Profil Başlığı
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)' },
      default: {},
    }),
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  email: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },

  // Kart Grubu (Apple Inset Card Style)
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' },
      default: {},
    }),
  },
  itemWrapper: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
    gap: 14,
  },
  iconSlot: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.15,
  },
  chevron: {
    opacity: 0.6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 54, // İkon genişliği kadar içeriden başlayan şık bölücü çizgi
  },
});
