import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ListingsFilterSidebar,
  type ListingsFiltersState,
} from '@/components/listings/ListingsFilterSidebar';
import { MOBILE_INK } from '@/components/layout/glassStyles';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useSafeInsets } from '@/hooks/useSafeInsets';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { CatalogFacets } from '@/types';

type MobileListingsFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  facets: CatalogFacets | null;
  value: ListingsFiltersState;
  onChange: (next: ListingsFiltersState) => void;
  resultCount: number;
  onClear: () => void;
};

/** Mobil filtre bottom sheet — sidebar içeriğini sheet içinde sunar. */
export function MobileListingsFilterSheet({
  visible,
  onClose,
  facets,
  value,
  onChange,
  resultCount,
  onClear,
}: MobileListingsFilterSheetProps) {
  const insets = useSafeInsets();
  const primary = useThemeColor('primary');
  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Kapat"
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: surface,
              paddingBottom: Math.max(insets.bottom, Spacing.md),
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={[styles.head, { borderBottomColor: border }]}>
            <View>
              <Text style={[styles.headTitle, { color: text }]}>Filtreler</Text>
              <Text style={[styles.headSub, { color: textMuted }]}>
                {resultCount} ilan
              </Text>
            </View>
            <View style={styles.headActions}>
              <Pressable
                onPress={onClear}
                accessibilityRole="button"
                accessibilityLabel="Filtreleri temizle"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.clearBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.clearText, { color: textMuted }]}>
                  Temizle
                </Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Kapat"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: `${MOBILE_INK}0F` },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="close" size={20} color={text} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ListingsFilterSidebar
              facets={facets}
              value={value}
              onChange={onChange}
              resultCount={resultCount}
              hideHeader
            />
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: border }]}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Sonuçları göster"
              style={({ pressed }) => [
                styles.applyBtn,
                { backgroundColor: primary, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={styles.applyText}>
                {resultCount} ilanı göster
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12,12,14,0.55)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: { elevation: 20 },
      web: {
        boxShadow: '0 -12px 40px rgba(0,0,0,0.25)',
      } as object,
      default: {},
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(12,12,14,0.15)',
    marginTop: 10,
    marginBottom: 4,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  headActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyBtn: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
