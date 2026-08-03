import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenWrapper } from '@/components/ui';
import { useThemeColor } from '@/hooks/useThemeColor';

// ── Demo durumları ────────────────────────────────────────────────────────────
type DemoMode = 'loading' | 'empty' | 'error';

// ── Seçici buton ─────────────────────────────────────────────────────────────
function ModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const primary = useThemeColor('primary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const text = useThemeColor('text');

  return (
    <TouchableOpacity
      style={[
        styles.modeBtn,
        { borderColor: active ? primary : border, backgroundColor: active ? primary : surface },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.modeBtnText, { color: active ? '#fff' : text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Sayfa ─────────────────────────────────────────────────────────────────────
export default function DemoScreen() {
  const [mode, setMode] = useState<DemoMode>('loading');
  const bg = useThemeColor('background');
  const border = useThemeColor('border');

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      {/* Üst buton çubuğu */}
      <View style={[styles.bar, { borderBottomColor: border }]}>
        <ModeButton label="⏳ Loading" active={mode === 'loading'} onPress={() => setMode('loading')} />
        <ModeButton label="📭 Empty"   active={mode === 'empty'}   onPress={() => setMode('empty')}   />
        <ModeButton label="⚠️ Error"   active={mode === 'error'}   onPress={() => setMode('error')}   />
      </View>

      {/* State gösterimi */}
      <ScreenWrapper
        isLoading={mode === 'loading'}
        loadingVariant="cards"
        loadingCount={3}

        isEmpty={mode === 'empty'}
        emptyVariant="listing"
        emptyTitle="Henüz ilan yok"
        emptyDescription="Şu an gösterilecek ilan bulunamadı. Daha sonra tekrar kontrol edin."
        emptyActionLabel="Yenile"
        onEmptyAction={() => setMode('loading')}

        isError={mode === 'error'}
        errorVariant="network"
        errorMessage="Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin."
        onRetry={() => setMode('loading')}

        scrollable={false}
      >
        <View />
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  bar: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
