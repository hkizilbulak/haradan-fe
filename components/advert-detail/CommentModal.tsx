import React, { memo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';

type CommentModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
  isSubmitting: boolean;
};

export const CommentModal = memo(function CommentModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
}: CommentModalProps) {
  const [content, setContent] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const background = useThemeColor('background');
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const primary = useThemeColor('header');
  const errorColor = useThemeColor('error');

  const handleClose = () => {
    setContent('');
    setValidationError(null);
    onClose();
  };

  const handlePublish = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setValidationError('Lütfen bir yorum metni giriniz.');
      return;
    }
    if (trimmed.length > 1000) {
      setValidationError('Yorum en fazla 1000 karakter olabilir.');
      return;
    }

    setValidationError(null);
    try {
      await onSubmit(trimmed);
      handleClose();
    } catch {
      // Error handled by parent hook
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: background, borderColor: border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: text }]}>İlana Yorum Yaz</Text>
            <Pressable onPress={handleClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={text} />
            </Pressable>
          </View>

          <Text style={[styles.hint, { color: textMuted }]}>
            Yorumunuz doğrudan yayınlanacaktır. Lütfen nezaket kurallarına dikkat ediniz.
          </Text>

          {validationError ? (
            <Text style={[styles.errorText, { color: errorColor }]}>
              {validationError}
            </Text>
          ) : null}

          <TextInput
            style={[
              styles.input,
              { color: text, borderColor: border, backgroundColor: background },
            ]}
            placeholder="Yorumunuzu buraya yazabilirsiniz..."
            placeholderTextColor={textMuted}
            multiline
            numberOfLines={4}
            maxLength={1000}
            value={content}
            onChangeText={(txt) => {
              setContent(txt);
              if (validationError) setValidationError(null);
            }}
          />

          <View style={styles.footer}>
            <Text style={[styles.counter, { color: textMuted }]}>
              {content.trim().length} / 1000
            </Text>

            <View style={styles.actionRow}>
              <Pressable
                onPress={handleClose}
                disabled={isSubmitting}
                style={[styles.cancelBtn, { borderColor: border }]}
              >
                <Text style={[styles.cancelText, { color: text }]}>Vazgeç</Text>
              </Pressable>

              <Pressable
                onPress={handlePublish}
                disabled={isSubmitting || !content.trim()}
                style={[
                  styles.submitBtn,
                  { backgroundColor: primary, opacity: isSubmitting || !content.trim() ? 0.6 : 1 },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.submitText}>Yayınla</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.input,
    padding: Spacing.md,
    minHeight: 110,
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  counter: {
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: Radius.input,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.input,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
