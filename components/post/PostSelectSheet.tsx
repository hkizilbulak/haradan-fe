import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

export type SelectOption = { label: string; value: string };

type PostSelectSheetProps = {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selectedValue?: unknown;
  emptyText?: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};

export function PostSelectSheet({
  visible,
  title,
  options,
  selectedValue,
  emptyText = 'Seçenek bulunamadı.',
  onClose,
  onSelect,
}: PostSelectSheetProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const muted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const primary = useThemeColor('primary');

  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const showSearch = options.length > 3;

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr');
    if (!q) return options;
    return options.filter((opt) => {
      const label = (opt.label || opt.value).toLocaleLowerCase('tr');
      const val = (opt.value || '').toLocaleLowerCase('tr');
      return label.includes(q) || val.includes(q);
    });
  }, [options, searchQuery]);

  const checkSelected = (opt: SelectOption) => {
    if (selectedValue == null || selectedValue === '') return false;
    const sVal = String(selectedValue).toLocaleLowerCase('tr').trim();
    const optVal = (opt.value || opt.label).toLocaleLowerCase('tr').trim();
    const optValue = (opt.value || '').toLocaleLowerCase('tr').trim();
    const optLabel = (opt.label || '').toLocaleLowerCase('tr').trim();

    return (
      sVal === optVal ||
      sVal === optValue ||
      sVal === optLabel ||
      (sVal !== '' && (
        (sVal.includes('ingiliz') && optVal.includes('ingiliz')) ||
        (sVal.includes('arap') && optVal.includes('arap'))
      ))
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => {
        inputRef.current?.focus();
      }}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: surface,
              borderColor: border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: text }]} numberOfLines={1}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="close" size={22} color={secondary} />
            </Pressable>
          </View>

          {/* Search bar if many items */}
          {showSearch ? (
            <View style={[styles.search, { borderColor: border }]}>
              <Ionicons name="search-outline" size={18} color={muted} />
              <TextInput
                ref={inputRef}
                autoFocus
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Seçenek ara..."
                placeholderTextColor={muted}
                style={[styles.input, { color: text }]}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                  <Ionicons name="close-circle" size={16} color={muted} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Options List */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {filteredOptions.map((opt) => {
              const selected = checkSelected(opt);
              return (
                <Pressable
                  key={opt.value || opt.label}
                  onPress={() => {
                    onSelect(opt.value || opt.label);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.optionItem,
                    {
                      borderColor: selected ? header : border,
                      backgroundColor: selected
                        ? header + '18'
                        : pressed
                        ? border + '40'
                        : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color: selected ? header : text,
                        fontWeight: selected ? '700' : '400',
                      },
                    ]}
                  >
                    {opt.label || opt.value}
                  </Text>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={20} color={header} />
                  ) : null}
                </Pressable>
              );
            })}

            {filteredOptions.length === 0 ? (
              <Text style={[styles.empty, { color: secondary }]}>{emptyText}</Text>
            ) : null}
          </ScrollView>

          {/* Cancel button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancelBtn,
              { borderColor: border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.cancelText, { color: secondary }]}>Vazgeç</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 14, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '82%',
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
        } as object)
      : {
          elevation: 12,
        }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xs,
  },
  title: {
    ...Typography.h3,
    fontSize: 18,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
    marginLeft: Spacing.sm,
  },
  search: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontSize: 14,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  list: {
    maxHeight: 320,
    ...Platform.select({
      web: {
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      } as any,
      default: {},
    }),
  },
  listContent: {
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  optionItem: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    ...Typography.body,
    fontSize: 15,
    flex: 1,
  },
  empty: {
    ...Typography.small,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  cancelBtn: {
    minHeight: 42,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '600',
  },
});
