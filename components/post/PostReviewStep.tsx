import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { AdvertId } from '@/types/advertId';
import { formatAdvertId } from '@/types/advertId';
import { copyToClipboard } from '@/utils/copyToClipboard';

type PostReviewStepProps = {
  advertId: AdvertId | null;
  status: string | null;
  title: string;
  onGoListings: () => void;
  onGoHome: () => void;
};

export function PostReviewStep({
  advertId,
  status,
  title,
  onGoListings,
  onGoHome,
}: PostReviewStepProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const muted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const success = useThemeColor('success');
  const primary = useThemeColor('primary');
  const [copied, setCopied] = useState(false);

  const displayId = formatAdvertId(advertId);

  const onCopy = useCallback(async () => {
    if (!displayId) return;
    const ok = await copyToClipboard(displayId);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [displayId]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: success }]}>
        <Ionicons name="checkmark" size={28} color="#fff" />
      </View>
      <Text style={[styles.kicker, { color: muted }]}>Adım 4 · Gönderildi</Text>
      <Text style={[styles.title, { color: text }]}>İlan incelemeye alındı</Text>
      <Text style={[styles.lead, { color: secondary }]}>
        “{title}” taslağı oluşturuldu
        {status ? ` (${status})` : ''}. Yayın, editör onayından sonra görünür.
        Paket ataması onay sonrası yapılır.
      </Text>
      {displayId ? (
        <View style={[styles.meta, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.metaLabel, { color: muted }]}>İlan no</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.metaValue, { color: text }]} selectable>
              {displayId}
            </Text>
            <Pressable
              onPress={() => void onCopy()}
              accessibilityRole="button"
              accessibilityLabel={copied ? 'Kopyalandı' : 'İlan numarasını kopyala'}
              hitSlop={8}
              style={({ pressed }) => [
                styles.copyBtn,
                { borderColor: border, backgroundColor: copied ? `${primary}14` : 'transparent' },
                pressed && { opacity: 0.72 },
              ]}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={18}
                color={copied ? primary : muted}
              />
              <Text style={[styles.copyLabel, { color: copied ? primary : muted }]}>
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <Button onPress={onGoListings}>İlanlarıma git</Button>
      <Button variant="ghost" onPress={onGoHome}>
        Ana sayfa
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md, alignItems: 'center', paddingTop: Spacing.lg },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: { ...Typography.h2, textAlign: 'center' },
  lead: { ...Typography.body, textAlign: 'center' },
  meta: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.md,
    gap: 8,
  },
  metaLabel: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaValue: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    fontVariant: Platform.OS === 'web' ? (['tabular-nums'] as const) : undefined,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  copyLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
