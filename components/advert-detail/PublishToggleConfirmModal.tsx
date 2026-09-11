import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';

type PublishToggleConfirmModalProps = {
  visible: boolean;
  isPublished: boolean;
  title: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function PublishToggleConfirmModal({
  visible,
  isPublished,
  title,
  loading = false,
  onCancel,
  onConfirm,
}: PublishToggleConfirmModalProps) {
  const dialogTitle = isPublished ? 'İlanı Yayından Kaldır' : 'İlanı Tekrar Yayınla';
  const actionLabel = isPublished ? 'Yayından Kaldır' : 'Yayına Al';

  const accentColor = isPublished ? '#ef4444' : '#10b981';
  const accentSoft = isPublished ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)';
  const accentBorder = isPublished ? 'rgba(239, 68, 68, 0.28)' : 'rgba(16, 185, 129, 0.28)';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <View style={styles.backdrop}>
        {/* Arka plan tıklamasıyla kapat */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={loading ? undefined : onCancel}
        />

        <View style={styles.sheet}>
          {/* Kapat butonu */}
          <Pressable
            onPress={loading ? undefined : onCancel}
            disabled={loading}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] },
            ]}
          >
            <Ionicons name="close" size={18} color="#9ca3af" />
          </Pressable>

          {/* İkon Rozeti */}
          <View style={[styles.iconOuterRing, { backgroundColor: accentSoft, borderColor: accentBorder }]}>
            <View style={[styles.iconInner, { backgroundColor: accentSoft }]}>
              <Ionicons
                name={isPublished ? 'eye-off' : 'cloud-upload'}
                size={26}
                color={accentColor}
              />
            </View>
          </View>

          {/* Başlık ve İlan Adı */}
          <View style={styles.textWrap}>
            <Text style={styles.title}>{dialogTitle}</Text>
            <View style={styles.listingTagWrap}>
              <Text style={styles.listingTagText} numberOfLines={1}>
                {title}
              </Text>
            </View>
          </View>

          {/* Bilgi / Açıklama Kutusu */}
          <View style={[styles.infoBox, { backgroundColor: accentSoft, borderColor: accentBorder }]}>
            <Ionicons
              name={isPublished ? 'information-circle-outline' : 'checkmark-circle-outline'}
              size={18}
              color={accentColor}
              style={{ marginTop: 1 }}
            />
            <Text style={styles.infoText}>
              {isPublished
                ? 'İlanınız tamamen yayından kaldırılacak ve diğer kullanıcılara gizlenecektir. İlan bilgileriniz silinmez; dilediğiniz zaman tek tıkla tekrar yayına alabilirsiniz.'
                : 'İlanınız hemen yayına alınacak ve tüm alıcılar tarafından görüntülenebilir hale gelecektir.'}
            </Text>
          </View>

          {/* Aksiyon Butonları */}
          <View style={styles.actions}>
            <Pressable
              onPress={loading ? undefined : onCancel}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Vazgeç"
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.cancelText}>Vazgeç</Text>
            </Pressable>

            <Pressable
              onPress={loading ? undefined : onConfirm}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              style={({ pressed }) => [
                styles.confirmBtn,
                {
                  backgroundColor: accentColor,
                  ...Platform.select({
                    web: {
                      boxShadow: isPublished
                        ? '0 4px 14px rgba(239, 68, 68, 0.35)'
                        : '0 4px 14px rgba(16, 185, 129, 0.35)',
                    } as any,
                    default: {},
                  }),
                },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons
                    name={isPublished ? 'eye-off-outline' : 'checkmark-outline'}
                    size={17}
                    color="#ffffff"
                  />
                  <Text style={styles.confirmText}>{actionLabel}</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 9, 15, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      } as any,
      default: {},
    }),
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#15171e',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    gap: 16,
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow:
          '0 24px 60px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.06)',
      } as any,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.45,
        shadowRadius: 28,
      },
      android: {
        elevation: 16,
      },
      default: {},
    }),
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.15s ease' } as any,
      default: {},
    }),
  },
  iconOuterRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  iconInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  listingTagWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 3,
    maxWidth: '90%',
  },
  listingTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d1d5db',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#cbd5e1',
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.15s ease' } as any,
      default: {},
    }),
  },
  cancelText: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1.2,
    minHeight: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 14,
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.15s ease' } as any,
      default: {},
    }),
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
