import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { phoneCountryCatalog } from '@/services/phone';
import type { PhoneCountry } from '@/types/phone';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type PostCountrySheetProps = {
  visible: boolean;
  selectedIso: string;
  onClose: () => void;
  onSelect: (country: PhoneCountry) => void;
};

export function PostCountrySheet({
  visible,
  selectedIso,
  onClose,
  onSelect,
}: PostCountrySheetProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const muted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const success = useThemeColor('success');
  const [q, setQ] = useState('');
  const countries = useMemo(() => phoneCountryCatalog.list(), []);
  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr');
    if (!needle) return countries;
    return countries.filter(
      (c) =>
        c.name.toLocaleLowerCase('tr').includes(needle) ||
        c.dial.includes(needle) ||
        c.iso.toLowerCase().includes(needle)
    );
  }, [countries, q]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: surface }]}>
          <Text style={[styles.title, { color: text }]}>Ülke kodu</Text>
          <View style={[styles.search, { borderColor: border }]}>
            <Ionicons name="search-outline" size={18} color={muted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Ülke veya kod ara"
              placeholderTextColor={muted}
              style={[styles.input, { color: text }]}
            />
          </View>
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {filtered.map((c) => {
              const selected = c.iso === selectedIso;
              return (
                <Pressable
                  key={c.iso}
                  onPress={() => {
                    onSelect(c);
                    onClose();
                    setQ('');
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      borderColor: selected ? success : border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={styles.flag}>{c.flag}</Text>
                  <View style={styles.meta}>
                    <Text style={[styles.name, { color: text }]}>{c.name}</Text>
                    <Text style={[styles.dial, { color: secondary }]}>{c.dial}</Text>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={20} color={success} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12,12,14,0.45)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  sheet: {
    maxHeight: 520,
    borderRadius: 20,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: { ...Typography.h3 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  input: { flex: 1, ...Typography.body },
  list: { maxHeight: 360 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  flag: { fontSize: 22 },
  meta: { flex: 1 },
  name: { ...Typography.small, fontWeight: '600' },
  dial: { ...Typography.caption },
});
