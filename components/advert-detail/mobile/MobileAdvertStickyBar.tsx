import React, { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOBILE_DETAIL_STICKY_BAR_HEIGHT, MOBILE_DOCK_BAR_HEIGHT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useSafeInsets } from '@/hooks/useSafeInsets';
import { useThemeColor } from '@/hooks/useThemeColor';
import { formatMoney } from '@/utils/formatMoney';
import { WHATSAPP_GREEN } from '@/utils/contactLinks';
import type { AdvertDetail } from '@/types';

type MobileAdvertStickyBarProps = {
  detail: AdvertDetail;
  isOwner?: boolean;
  onCall?: () => void;
  onWhatsApp?: () => void;
  onEdit?: () => void;
};

/** Dock üstünde sıfır boşlukla oturan sabit iletişim CTA çubuğu (Ara & WhatsApp). */
export const MobileAdvertStickyBar = memo(function MobileAdvertStickyBar({
  detail,
  isOwner = false,
  onCall,
  onWhatsApp,
  onEdit,
}: MobileAdvertStickyBarProps) {
  const insets = useSafeInsets();
  const header = useThemeColor('header');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');

  const isSold = detail.backendStatus === 'SOLD';
  /** Dock ile arasında 0 boşluk olacak şekilde tam dock üstüne oturur */
  const bottom = MOBILE_DOCK_BAR_HEIGHT + (insets.bottom || 0);

  return (
    <View
      style={[
        styles.wrap,
        {
          bottom,
          backgroundColor: surface,
          borderTopColor: border,
          minHeight: 60,
        },
      ]}
    >
      {isOwner ? (
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel="İlanı düzenle"
          style={({ pressed }) => [
            styles.editBtn,
            { borderColor: header },
            pressed && { opacity: 0.88 },
          ]}
        >
          <Ionicons name="create-outline" size={16} color={header} />
          <Text style={[styles.editText, { color: header }]}>İlanı Düzenle</Text>
        </Pressable>
      ) : (
        <View style={styles.actions}>
          <Pressable
            onPress={isSold ? undefined : onCall}
            disabled={isSold}
            accessibilityRole="button"
            accessibilityLabel="Ara"
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: isSold ? '#9ca3af' : header },
              pressed && { opacity: 0.88 },
            ]}
          >
            <Ionicons name="call" size={17} color="#fff" />
            <Text style={styles.ctaText}>{isSold ? 'Satıldı' : 'Ara'}</Text>
          </Pressable>
          <Pressable
            onPress={isSold ? undefined : onWhatsApp}
            disabled={isSold}
            accessibilityRole="button"
            accessibilityLabel="WhatsApp"
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: isSold ? '#9ca3af' : WHATSAPP_GREEN },
              pressed && { opacity: 0.88 },
            ]}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={styles.ctaText}>WhatsApp</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 10 },
      web: {
        boxShadow: '0 -3px 12px rgba(0, 0, 0, 0.12)',
      },
      default: {},
    }),
  },
  actions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cta: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: -0.1,
  },
  editBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
