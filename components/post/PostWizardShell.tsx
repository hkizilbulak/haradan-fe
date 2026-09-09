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
import { PostStepper } from './PostStepper';
import { Button } from '@/components/ui/Button';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { ListingWizardStep } from '@/types/listing';

type PostWizardShellProps = {
  step: ListingWizardStep;
  canNext: boolean;
  nextLabel: string;
  nextLoading?: boolean;
  showBack: boolean;
  showNext: boolean;
  showPreview?: boolean;
  onPreview?: () => void;
  previewLabel?: string;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  children: React.ReactNode;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  onPressStep: (key: ListingWizardStep) => void;
};

export function PostWizardShell({
  step,
  canNext,
  nextLabel,
  nextLoading,
  showBack,
  showNext,
  showPreview,
  onPreview,
  previewLabel = 'İlan Önizleme',
  scrollViewRef,
  children,
  onClose,
  onBack,
  onNext,
  onPressStep,
}: PostWizardShellProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const bg = useThemeColor('background');
  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const border = useThemeColor('border');
  const contentMax = step === 'package' ? 980 : 720;

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top }]}>
      <View
        style={[
          styles.top,
          { backgroundColor: surface, borderBottomColor: border },
        ]}
      >
        <View style={[styles.topInner, isWide && { maxWidth: contentMax, width: '100%', alignSelf: 'center' }]}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            style={({ pressed }) => [styles.close, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="close" size={22} color={text} />
          </Pressable>
          <Text style={[styles.brand, { color: text }]}>İlan Ver</Text>
          <View style={styles.close} />
        </View>
        <View style={[styles.stepWrap, isWide && { maxWidth: contentMax, width: '100%', alignSelf: 'center' }]}>
          <PostStepper step={step} onPressStep={onPressStep} />
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: contentMax,
            paddingBottom:
              24 + Math.max(insets.bottom, 12) + (showBack || showNext ? 72 : 0),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {showBack || showNext ? (
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
          <View style={[styles.footerInner, { maxWidth: contentMax }]}>
            <View style={styles.leftAction}>
              {showBack ? (
                <Button
                  variant="secondary"
                  size="md"
                  onPress={onBack}
                  accessibilityLabel="Geri"
                >
                  Geri
                </Button>
              ) : null}
            </View>

            <View style={styles.rightActions}>
              {showPreview && onPreview ? (
                <Button
                  variant="secondary"
                  size="lg"
                  onPress={onPreview}
                  accessibilityLabel={previewLabel}
                  style={styles.actionBtn}
                >
                  {previewLabel}
                </Button>
              ) : null}
              {showNext ? (
                <Button
                  variant="dark"
                  size="lg"
                  onPress={onNext}
                  disabled={!canNext}
                  loading={nextLoading}
                  accessibilityLabel={nextLabel}
                  style={styles.actionBtn}
                >
                  {nextLabel}
                </Button>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
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
    maxWidth: 980,
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
  stepWrap: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  scroll: { flex: 1 },
  content: {
    width: '100%',
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
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  leftAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    flexShrink: 1,
  },
  actionBtn: {
    minWidth: 120,
    flexShrink: 1,
    ...Platform.select({
      web: { minWidth: 170 },
      default: {},
    }),
  },
});
