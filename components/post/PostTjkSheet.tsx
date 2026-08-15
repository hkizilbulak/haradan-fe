import React, { useEffect, useState } from 'react';
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
import { useTjkSearch } from '@/hooks/useTjkSearch';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import type { TjkHorseSummary } from '@/types/listing';

type TjkSheetMode = 'ask' | 'search';

type PostTjkSheetProps = {
  visible: boolean;
  initialMode?: TjkSheetMode;
  onClose: () => void;
  onSkip: () => void;
  onSelect: (horseId: string) => void;
};

export function PostTjkSheet({
  visible,
  initialMode = 'ask',
  onClose,
  onSkip,
  onSelect,
}: PostTjkSheetProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const muted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const primary = useThemeColor('primary');
  const header = useThemeColor('header');
  const [mode, setMode] = useState<TjkSheetMode>(initialMode);
  const [query, setQuery] = useState('');
  const { results, loading, error } = useTjkSearch(mode === 'search' ? query : '');

  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      setQuery('');
    }
  }, [visible, initialMode]);

  const handleClose = () => {
    setMode('ask');
    setQuery('');
    onClose();
  };

  const handleSkip = () => {
    setMode('ask');
    setQuery('');
    onSkip();
  };

  const handlePick = (item: TjkHorseSummary) => {
    setMode('ask');
    setQuery('');
    onSelect(item.horseId);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={mode === 'search' ? () => setMode('ask') : undefined}
        />
        <View style={[styles.sheet, { backgroundColor: surface }]}>
          {mode === 'ask' ? (
            <>
              <View style={[styles.iconCircle, { backgroundColor: header }]}>
                <Ionicons name="ribbon-outline" size={28} color="#fff" />
              </View>
              <Text style={[styles.title, { color: text }]}>
                Atınız TJK’da kayıtlı mı?
              </Text>
              <Text style={[styles.lead, { color: secondary }]}>
                Kayıtlıysa adını arayıp seçin; kimlik bilgileri otomatik dolsun.
              </Text>
              <Pressable
                onPress={() => setMode('search')}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: header, opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <Text style={styles.primaryLabel}>Evet, kayıtlı</Text>
              </Pressable>
              <Pressable
                onPress={handleSkip}
                style={({ pressed }) => [
                  styles.ghostBtn,
                  { borderColor: border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.ghostLabel, { color: text }]}>
                  Hayır, elle dolduracağım
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: text }]}>TJK kaydı</Text>
              <Text style={[styles.lead, { color: secondary }]}>
                At adı veya TJK sicil numarası ile arayın.
              </Text>
              <View style={[styles.search, { borderColor: border }]}>
                <Ionicons name="search-outline" size={18} color={muted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="At adı veya sicil no"
                  placeholderTextColor={muted}
                  autoFocus
                  style={[styles.searchInput, { color: text }]}
                  accessibilityLabel="TJK at adı"
                />
                {loading ? (
                  <ActivityIndicator size="small" color={primary} />
                ) : null}
              </View>
              <ScrollView
                style={styles.results}
                keyboardShouldPersistTaps="handled"
              >
                {results.map((item) => (
                  <Pressable
                    key={item.horseId}
                    onPress={() => handlePick(item)}
                    style={({ pressed }) => [
                      styles.result,
                      { borderColor: border, opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <View style={styles.resultCopy}>
                      <Text style={[styles.resultName, { color: text }]}>
                        {item.registeredName}
                      </Text>
                      <Text style={[styles.resultMeta, { color: secondary }]}>
                        {item.tjkNumber}
                        {item.birthYear ? ` · ${item.birthYear}` : ''}
                        {item.sireName ? ` · ${item.sireName}` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={muted} />
                  </Pressable>
                ))}
                {error ? (
                  <Text style={[styles.empty, { color: secondary }]}>{error}</Text>
                ) : null}
                {query.trim().length >= 2 && !loading && !error && results.length === 0 ? (
                  <Text style={[styles.empty, { color: secondary }]}>
                    Eşleşen kayıt yok. Farklı bir ad deneyin.
                  </Text>
                ) : null}
              </ScrollView>
              <Pressable onPress={handleSkip} hitSlop={8}>
                <Text style={[styles.skip, { color: secondary }]}>
                  Kayıtlı değil, elle devam et
                </Text>
              </Pressable>
            </>
          )}
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
    borderRadius: 28,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Platform.select({
      web: { boxShadow: '0 24px 64px rgba(12, 12, 14, 0.28)' },
      default: { elevation: 12 },
    }),
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    ...Typography.h3,
    textAlign: 'center',
  },
  lead: {
    ...Typography.body,
    textAlign: 'center',
  },
  primaryBtn: {
    minHeight: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    ...Typography.small,
    fontWeight: '700',
    color: '#fff',
  },
  ghostBtn: {
    minHeight: 48,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostLabel: {
    ...Typography.small,
    fontWeight: '600',
  },
  search: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  results: { gap: Spacing.sm, maxHeight: 280 },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  resultCopy: { flex: 1, gap: 2 },
  resultName: { ...Typography.h5 },
  resultMeta: { ...Typography.caption },
  empty: { ...Typography.small, textAlign: 'center', paddingVertical: Spacing.sm },
  skip: {
    ...Typography.small,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
