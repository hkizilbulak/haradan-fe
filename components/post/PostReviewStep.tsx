import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type PostReviewStepProps = {
  advertId: string | null;
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
      {advertId ? (
        <View style={[styles.meta, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.metaLabel, { color: muted }]}>İlan no</Text>
          <Text style={[styles.metaValue, { color: text }]}>{advertId}</Text>
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
    gap: 4,
  },
  metaLabel: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaValue: { ...Typography.small, fontWeight: '600' },
});
