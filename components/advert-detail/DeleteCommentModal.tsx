import React, { memo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';

type DeleteCommentModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
};

export const DeleteCommentModal = memo(function DeleteCommentModal({
  visible,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteCommentModalProps) {
  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const errorColor = useThemeColor('error');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isDeleting ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.iconCircle}>
            <Ionicons name="trash-outline" size={26} color={errorColor} />
          </View>

          <View style={styles.content}>
            <Text style={[styles.title, { color: text }]}>Yorumu Sil</Text>
            <Text style={[styles.message, { color: textMuted }]}>
              Bu yorumunuzu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={isDeleting}
              style={({ pressed }) => [
                styles.cancelBtn,
                { borderColor: border },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Vazgeç"
            >
              <Text style={[styles.cancelText, { color: text }]}>Vazgeç</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={isDeleting}
              style={({ pressed }) => [
                styles.deleteBtn,
                { backgroundColor: errorColor },
                pressed && { opacity: 0.85 },
                isDeleting && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Yorumu Sil"
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="trash" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteText}>Evet, Sil</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(243, 71, 112, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
    marginTop: Spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.input,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.input,
    paddingVertical: 11,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
