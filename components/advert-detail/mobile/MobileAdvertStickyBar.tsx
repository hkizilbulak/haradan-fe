import React, { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOBILE_DOCK_BAR_HEIGHT } from '@/constants/Layout';
import { useSafeInsets } from '@/hooks/useSafeInsets';
import { useThemeColor } from '@/hooks/useThemeColor';
import { WHATSAPP_GREEN } from '@/utils/contactLinks';
import type { AdvertDetail } from '@/types';

type MobileAdvertStickyBarProps = {
  detail: AdvertDetail;
  isOwner?: boolean;
  onCall?: () => void;
  onWhatsApp?: () => void;
  onEdit?: () => void;
};

/**
 * Dock'un üstünde zarifçe yüzen (floating) sabit iletişim CTA çubuğu (Ara & WhatsApp).
 * Alt menü (dock) ve orta "+" (İlan Ver) butonuyla çakışmaması için dinamik boşluk içerir.
 */
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

  // Alt dock yüksekliği + safe area payı
  const dockHeight = MOBILE_DOCK_BAR_HEIGHT + Math.max(insets.bottom, 8);
  // Orta "+" FAB butonunun hemen üstünde, arada gereksiz boşluk bırakmadan kompakt ve şık durması için:
  const bottom = dockHeight + 6;

  return (
    <View
      style={[
        styles.wrap,
        {
          bottom,
          backgroundColor: surface,
          borderColor: border,
        },
      ]}
      pointerEvents="box-none"
    >
      {isOwner ? (
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel="İlanı düzenle"
          style={({ pressed }) => [
            styles.editBtn,
            { borderColor: header },
            pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Ionicons name="create-outline" size={18} color={header} />
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
              pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Ionicons name="call" size={18} color="#fff" />
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
              pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Ionicons name="logo-whatsapp" size={19} color="#fff" />
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
    left: 14,
    right: 14,
    zIndex: 50,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.22)',
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
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: -0.1,
  },
  editBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editText: {
    fontWeight: '700',
    fontSize: 15,
  },
});
