import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useNotifications } from '@/hooks/useNotifications';
import { useHeaderDrawers } from '@/components/layout/HeaderDrawersContext';

export function NotificationsDrawer() {
  const {
    items,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    unreadCount,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications();
  const router = useRouter();
  const drawers = useHeaderDrawers();

  React.useEffect(() => {
    void loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const primaryLight = useThemeColor('primaryLight');

  if (items.length === 0 && !loading) {
    return (
      <View style={styles.empty}>
        <Ionicons name="notifications-outline" size={28} color={textMuted} />
        <Text style={[styles.emptyTitle, { color: text }]}>
          Henüz bildirim yok
        </Text>
        <Text style={[styles.emptyDesc, { color: textMuted }]}>
          Size özel bildirimler burada görünecek.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerAction, { borderBottomColor: border, backgroundColor: surface }]}>
        <Pressable 
          onPress={() => void deleteAllNotifications()}
          style={({ pressed }) => [
            styles.deleteAllButton,
            pressed && { opacity: 0.6 }
          ]}
        >
          <Ionicons name="trash-outline" size={16} color="#ef4444" style={{ marginRight: 4 }} />
          <Text style={styles.deleteAllText}>Tümünü Sil</Text>
        </Pressable>

        <Pressable 
          onPress={() => void markAllAsRead()}
          style={({ pressed }) => [
            styles.markAllButton,
            pressed && { opacity: 0.6 }
          ]}
        >
          <Ionicons name="checkmark-done" size={16} color="#3b82f6" style={{ marginRight: 4 }} />
          <Text style={styles.markAllText}>Tümünü Okundu İşaretle</Text>
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {items.map((item) => (
          <Pressable
            key={item.id}
            style={[
              styles.notificationItem,
              { backgroundColor: surface, borderBottomColor: border },
              !item.readAt && { backgroundColor: primaryLight },
            ]}
            onPress={() => {
              if (!item.readAt) {
                void markAsRead(item.id);
              }
              if (item.eventType === 'PRICE_DROP' && item.payload?.advertId) {
                drawers?.closeNotifications();
                router.push(`/ilan/${item.payload.advertId}` as any);
              }
            }}
          >
            <View style={styles.itemHeader}>
              <Text style={[styles.itemDate, { color: textMuted }]}>
                {new Date(item.createdAt).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              {!item.readAt && (
                <View style={[styles.unreadDot, { backgroundColor: '#ef4444' }]} />
              )}
            </View>
            <Text style={[styles.itemTitle, { color: text }]}>{item.title}</Text>
            <Text style={[styles.itemBody, { color: textMuted }]}>{item.body}</Text>
            
            <Pressable
              style={({pressed}) => [styles.deleteBtn, pressed && { opacity: 0.5 }]}
              onPress={(e) => {
                e.stopPropagation();
                void deleteNotification(item.id);
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </Pressable>
          </Pressable>
        ))}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#94a3b8" />
          </View>
        )}
        {hasMore && !loading && items.length > 0 && (
          <Pressable style={[styles.loadMoreBtn, { borderTopColor: border }]} onPress={() => void loadMore()}>
            <Text style={styles.loadMoreText}>Daha Fazla</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerAction: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteAllText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#ef4444',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3b82f6',
  },
  list: {
    paddingTop: 8,
    paddingBottom: Spacing.xl,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: 10,
  },
  emptyTitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 220,
  },
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deleteBtn: {
    padding: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemBody: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  itemDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadMoreBtn: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
});
