import React, { useRef } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@/hooks/useNotifications';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useHeaderDrawers } from '@/components/layout/HeaderDrawersContext';

export function NotificationBell() {
  const { unreadCount, items, hasMore, loadMore } = useNotifications();
  const drawers = useHeaderDrawers();
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const headerMuted = useThemeColor('headerMuted');
  const badgeSuccess = useThemeColor('badgeSuccess');
  const header = useThemeColor('header');

  const handleOpen = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (drawers) {
      drawers.openNotifications();
    }
  };

  const handleToggle = () => {
    if (drawers?.notificationsOpen) {
      drawers.closeNotifications();
    } else {
      handleOpen();
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityLabel="Bildirimler"
        hitSlop={8}
        style={({ pressed }) => [styles.iconHit, { opacity: pressed ? 0.55 : 1 }]}
      >
        <Ionicons name="notifications-outline" size={18} color={headerMuted} />
        {unreadCount > 0 && (
          <View
            style={[
              styles.countBadge,
              { backgroundColor: badgeSuccess, borderColor: header },
            ]}
          >
            <Text style={styles.countText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  iconHit: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  countBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  countText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
});
