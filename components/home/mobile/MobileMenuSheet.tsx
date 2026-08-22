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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BrandMark } from '@/components/layout/BrandMark';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
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

const NAV: { key: HeaderNavKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: 'Anasayfa', icon: 'home-outline' },
  { key: 'listings', label: 'Tüm ilanlar', icon: 'grid-outline' },
  { key: 'my-listings', label: 'İlanlarım', icon: 'document-text-outline' },
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
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const primary = useThemeColor('primary');
  const border = useThemeColor('border');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              paddingTop: insets.top + Spacing.md,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.head}>
            <BrandMark variant="dark" height={28} />
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Kapat">
              <Ionicons name="close" size={24} color={text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.section, { color: textSecondary }]}>Menü</Text>
            {NAV.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => {
                  onNav(item.key);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name={item.icon} size={20} color={primary} />
                <Text style={[styles.rowLabel, { color: text }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={textSecondary} />
              </Pressable>
            ))}

            {!isLoggedIn ? (
              <Pressable
                onPress={() => {
                  onLogin();
                  onClose();
                }}
                style={[styles.loginBtn, { backgroundColor: primary }]}
              >
                <Text style={styles.loginText}>Giriş yap / Kayıt ol</Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => {
                onPostAd();
                onClose();
              }}
              style={[styles.postBtn, { borderColor: border }]}
            >
              <Ionicons name="add-circle-outline" size={20} color={primary} />
              <Text style={[styles.postLabel, { color: text }]}>İlan ver</Text>
            </Pressable>

            {categories.length > 0 ? (
              <>
                <Text style={[styles.section, { color: textSecondary }]}>
                  Kategoriler
                </Text>
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      onCategory(cat);
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      { borderBottomColor: border, opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Ionicons name="folder-outline" size={20} color={textSecondary} />
                    <Text style={[styles.rowLabel, { color: text }]}>{cat.name}</Text>
                    <Ionicons name="chevron-forward" size={18} color={textSecondary} />
                  </Pressable>
                ))}
              </>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12,12,14,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: Spacing.lg,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      } as object,
      default: {},
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(12,12,14,0.12)',
    marginBottom: Spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  section: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    ...Typography.body,
    flex: 1,
    fontWeight: '500',
  },
  loginBtn: {
    marginTop: Spacing.lg,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  postBtn: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  postLabel: {
    fontWeight: '600',
    fontSize: 15,
  },
});
