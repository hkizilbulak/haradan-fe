import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OnlineCheckoutResult, PaymentMethod } from '@/types/payment';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type PostIyzicoSheetProps = {
  visible: boolean;
  method: PaymentMethod | null;
  loading: boolean;
  result: OnlineCheckoutResult | null;
  error: string | null;
  onClose: () => void;
};

export function PostIyzicoSheet({
  visible,
  method,
  loading,
  result,
  error,
  onClose,
}: PostIyzicoSheetProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const success = useThemeColor('success');
  const errorColor = useThemeColor('error');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: surface }]}>
          <View style={styles.top}>
            <Text style={[styles.brand, { color: header }]}>iyzico</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Kapat">
              <Ionicons name="close" size={20} color={text} />
            </Pressable>
          </View>
          <Text style={[styles.title, { color: text }]}>
            {method?.label ?? 'Online ödeme'}
          </Text>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={header} />
              <Text style={[styles.note, { color: secondary }]}>
                Ödeme oturumu açılıyor…
              </Text>
            </View>
          ) : error ? (
            <Text style={[styles.note, { color: errorColor }]}>{error}</Text>
          ) : (
            <View style={[styles.box, { borderColor: border }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color={success} />
              <Text style={[styles.note, { color: secondary }]}>
                {result?.message ??
                  'Test ortamı. Canlı iyzico checkout URL’si backend bağlanınca gelecek.'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12,12,14,0.45)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  sheet: {
    borderRadius: 20,
    padding: Spacing.lg,
    gap: Spacing.md,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    ...Typography.caption,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: { ...Typography.h3 },
  center: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  box: {
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  note: { ...Typography.small, flex: 1 },
});
