import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

export type PlaceOption = { id: string; name: string };

type PostPlaceSheetProps = {
  visible: boolean;
  title: string;
  items: PlaceOption[];
  selectedId: string | null;
  loading?: boolean;
  emptyText?: string;
  onClose: () => void;
  onSelect: (id: string) => void;
};

export function PostPlaceSheet({
  visible,
  title,
  items,
  selectedId,
  loading = false,
  emptyText = 'Kayıt bulunamadı.',
  onClose,
  onSelect,
}: PostPlaceSheetProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const muted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const primary = useThemeColor('primary');
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr');
    if (!needle) return items;
    return items.filter((p) => p.name.toLocaleLowerCase('tr').includes(needle));
  }, [items, q]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: surface }]}>
          <Text style={[styles.title, { color: text }]}>{title}</Text>
          <View style={[styles.search, { borderColor: border }]}>
            <Ionicons name="search-outline" size={18} color={muted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Ara"
              placeholderTextColor={muted}
              style={[styles.input, { color: text }]}
            />
          </View>
          {loading ? (
            <ActivityIndicator color={primary} />
          ) : (
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {filtered.map((p) => {
                const selected = p.id === selectedId;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      onSelect(p.id);
                      onClose();
                      setQ('');
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        borderColor: selected ? primary : border,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.name, { color: text }]}>{p.name}</Text>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={18} color={primary} />
                    ) : null}
                  </Pressable>
                );
              })}
              {!filtered.length ? (
                <Text style={[styles.empty, { color: secondary }]}>{emptyText}</Text>
              ) : null}
            </ScrollView>
          )}
          <Pressable onPress={onClose}>
            <Text style={[styles.cancel, { color: secondary }]}>Vazgeç</Text>
          </Pressable>
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
    maxHeight: '80%',
    borderRadius: 28,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: { ...Typography.h3 },
  search: {
    minHeight: 44,
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
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  list: { maxHeight: 360 },
  row: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: { ...Typography.body },
  empty: { ...Typography.small, textAlign: 'center', paddingVertical: Spacing.md },
  cancel: { ...Typography.small, textAlign: 'center' },
});
