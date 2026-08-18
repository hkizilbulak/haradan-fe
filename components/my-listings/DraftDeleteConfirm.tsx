import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type DraftDeleteConfirmProps = {
  visible: boolean;
  title: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DraftDeleteConfirm({
  visible,
  title,
  loading = false,
  onCancel,
  onConfirm,
}: DraftDeleteConfirmProps) {
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={[styles.sheet, { backgroundColor: surface }]}>
          <Text style={[styles.title, { color: text }]}>Taslağı sil</Text>
          <Text style={[styles.body, { color: muted }]}>
            “{title}” taslağı kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </Text>
          <View style={styles.actions}>
            <Button
              variant="secondary"
              onPress={onCancel}
              disabled={loading}
              style={styles.action}
            >
              Vazgeç
            </Button>
            <Button
              variant="primary"
              onPress={onConfirm}
              loading={loading}
              accessibilityLabel="Taslağı sil"
              style={styles.action}
            >
              Sil
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 14, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    padding: Spacing.lg,
    gap: Spacing.md,
    zIndex: 1,
  },
  title: { ...Typography.h3 },
  body: { ...Typography.body },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  action: { flex: 1 },
});
