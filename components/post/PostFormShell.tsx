import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type PostFormShellProps = {
  title: string;
  canSave: boolean;
  saving?: boolean;
  saveLabel?: string;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  children: React.ReactNode;
  onClose: () => void;
  onSave: () => void;
};

export function PostFormShell({
  title,
  canSave,
  saving,
  saveLabel = 'Kaydet',
  scrollViewRef,
  children,
  onClose,
  onSave,
}: PostFormShellProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const bg = useThemeColor('background');
  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const border = useThemeColor('border');

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top }]}>
      <View
        style={[
          styles.top,
          { backgroundColor: surface, borderBottomColor: border },
        ]}
      >
        <View style={[styles.topInner, isWide && styles.topWide]}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            style={({ pressed }) => [styles.close, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="close" size={22} color={text} />
          </Pressable>
          <Text style={[styles.brand, { color: text }]}>{title}</Text>
          <View style={styles.close} />
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 24 + Math.max(insets.bottom, 12) + 72 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: surface,
            borderTopColor: border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.footerInner}>
          <Button
            variant="dark"
            size="lg"
            onPress={onSave}
            disabled={!canSave}
            loading={saving}
            accessibilityLabel={saveLabel}
          >
            {saveLabel}
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.md,
  },
  topInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  topWide: {
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { ...Typography.h5, fontWeight: '700' },
  scroll: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...Platform.select({
      web: { boxShadow: '0 -8px 24px rgba(15, 23, 42, 0.04)' },
      default: {},
    }),
  },
  footerInner: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
});
