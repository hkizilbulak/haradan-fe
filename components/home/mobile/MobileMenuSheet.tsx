import React, { useMemo } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BrandMark } from '@/components/layout/BrandMark';
import { MOBILE_INK } from '@/components/layout/glassStyles';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  getCategoryIcon,
  pickListingRootCategories,
} from '@/services/catalog/categoryDisplay';
import type { CategoryTreeNode } from '@/types';
import type { HeaderNavKey } from '@/services/navigation';

type MobileMenuSheetProps = {
  visible: boolean;
  onClose: () => void;
  categories: CategoryTreeNode[];
  onNav: (key: HeaderNavKey) => void;
  onCategory: (cat: CategoryTreeNode) => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onPostAd: () => void;
};

const NAV: {
  key: HeaderNavKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'home', label: 'Anasayfa', icon: 'home-outline' },
  { key: 'listings', label: 'Tüm ilanlar', icon: 'search-outline' },
  { key: 'my-listings', label: 'İlanlarım', icon: 'layers-outline' },
];

export function MobileMenuSheet({
  visible,
  onClose,
  categories,
  onNav,
  onCategory,
  isLoggedIn,
  onLogin,
  onPostAd,
}: MobileMenuSheetProps) {
  const insets = useSafeAreaInsets();
  const primary = useThemeColor('primary');

  const categoryRoots = useMemo(
    () => pickListingRootCategories(categories),
    [categories]
  );

  const run = (fn: () => void) => {
    fn();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Kapat" />

        <View
          style={[
            styles.sheet,
            {
              paddingTop: Spacing.md,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.head}>
            <BrandMark variant="light" height={24} />
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <View style={styles.navGroup}>
              {NAV.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => run(() => onNav(item.key))}
                  style={({ pressed }) => [
                    styles.navItem,
                    pressed && styles.navItemPressed,
                  ]}
                >
                  <View style={styles.navIcon}>
                    <Ionicons name={item.icon} size={18} color="#fff" />
                  </View>
                  <Text style={styles.navLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            {categoryRoots.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Kategoriler</Text>
                <View style={styles.categoryGrid}>
                  {categoryRoots.map((cat) => (
                    <Pressable
                      key={cat.id}
                      onPress={() => run(() => onCategory(cat))}
                      style={({ pressed }) => [
                        styles.categoryChip,
                        pressed && styles.categoryChipPressed,
                      ]}
                    >
                      <View style={styles.categoryIconWrap}>
                        <Ionicons
                          name={getCategoryIcon(cat.slug)}
                          size={16}
                          color="#fff"
                        />
                      </View>
                      <Text style={styles.categoryText} numberOfLines={2}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            {!isLoggedIn ? (
              <Pressable
                onPress={() => run(onLogin)}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: primary },
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text style={styles.primaryBtnText}>Giriş yap</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => run(onPostAd)}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Ionicons name="add" size={18} color={primary} />
              <Text style={[styles.secondaryBtnText, { color: primary }]}>
                İlan ver
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
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    maxHeight: '86%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: MOBILE_INK,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Platform.select({
      web: {
        boxShadow: '0 -16px 48px rgba(0,0,0,0.4)',
      } as object,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
      },
      android: { elevation: 24 },
      default: {},
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: Spacing.lg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scroll: {
    paddingBottom: Spacing.md,
  },
  navGroup: {
    gap: 6,
    marginBottom: Spacing.xl,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  navItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  navLabel: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '500',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8a8a93',
    letterSpacing: 0.2,
    marginBottom: Spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexBasis: '46%',
    flexGrow: 1,
    maxWidth: '48%',
  },
  categoryChipPressed: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
    flex: 1,
  },
  footer: {
    gap: 10,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  primaryBtn: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 14,
  },
  secondaryBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
