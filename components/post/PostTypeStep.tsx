import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostChoiceCard } from './PostChoiceCard';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { CategoryTreeNode } from '@/types';
import type { ListingTypeSelection } from '@/types/listing';
import type { ListingTypePhase } from '@/services/listing';

const POST_GROUP_SLUGS = [
  'satilik-atlar',
  'at-hizmetleri',
  'asim-hizmetleri',
] as const;

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'satilik-atlar': 'trophy-outline',
  'satilik-yaris-ati': 'flag-outline',
  'satilik-kisrak': 'female-outline',
  'satilik-aygir': 'male-outline',
  'satilik-binek-ati': 'walk-outline',
  'satilik-pony': 'paw-outline',
  'at-hizmetleri': 'construct-outline',
  'pansiyon-haralar': 'home-outline',
  'at-nakliyesi': 'car-outline',
  nalbantlar: 'hammer-outline',
  'asim-hizmetleri': 'heart-outline',
  'arap-aygir': 'flower-outline',
  'ingiliz-aygir': 'ribbon-outline',
};

type PostTypeStepProps = {
  phase: ListingTypePhase;
  categoryTree: CategoryTreeNode[];
  selectedRootSlug: string | null;
  selectedType: ListingTypeSelection | null;
  onSelectRoot: (root: ListingTypeSelection) => void;
  onSelectType: (type: ListingTypeSelection) => void;
};

function toSelection(
  node: CategoryTreeNode,
  parentSlug: string | null
): ListingTypeSelection {
  return {
    categoryId: node.id,
    categorySlug: node.slug,
    categoryName: node.name,
    parentSlug,
  };
}

export function PostTypeStep({
  phase,
  categoryTree,
  selectedRootSlug,
  selectedType,
  onSelectRoot,
  onSelectType,
}: PostTypeStepProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');

  const roots = useMemo(
    () =>
      categoryTree.filter((node) =>
        POST_GROUP_SLUGS.includes(
          node.slug as (typeof POST_GROUP_SLUGS)[number]
        )
      ),
    [categoryTree]
  );

  const selectedRoot = useMemo(
    () => roots.find((n) => n.slug === selectedRootSlug) ?? null,
    [roots, selectedRootSlug]
  );

  const subtypes = selectedRoot?.children ?? [];

  if (phase === 'category') {
    return (
      <View style={styles.wrap}>
        <Text style={[styles.kicker, { color: secondary }]}>
          Adım 1 · İlan türü
        </Text>
        <Text style={[styles.title, { color: text }]}>İlan türünü seçin</Text>
        <Text style={[styles.lead, { color: secondary }]}>
          {selectedRoot
            ? `${selectedRoot.name} kategorisinde hangi türde ilan vereceksiniz?`
            : 'Seçtiğiniz gruba uygun ilan türünü işaretleyin.'}
        </Text>
        <View style={styles.list}>
          {subtypes.map((node) => (
            <PostChoiceCard
              key={node.id}
              title={node.name}
              icon={CATEGORY_ICONS[node.slug] ?? 'grid-outline'}
              selected={selectedType?.categoryId === node.id}
              onPress={() =>
                onSelectType(toSelection(node, selectedRootSlug))
              }
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.kicker, { color: secondary }]}>Adım 1 · Kategori</Text>
      <Text style={[styles.title, { color: text }]}>
        Ne ilan vermek istiyorsunuz?
      </Text>
      <Text style={[styles.lead, { color: secondary }]}>
        Satılık at, hizmet veya aşım — önce ana grubu seçin.
      </Text>
      <View style={styles.list}>
        {roots.map((node) => (
          <PostChoiceCard
            key={node.id}
            title={node.name}
            subtitle={`${node.children.length} ilan türü`}
            icon={CATEGORY_ICONS[node.slug] ?? 'grid-outline'}
            selected={selectedRootSlug === node.slug}
            onPress={() => {
              if (node.children.length === 0) {
                onSelectType(toSelection(node, null));
                return;
              }
              onSelectRoot(toSelection(node, null));
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  kicker: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: { ...Typography.h2 },
  lead: { ...Typography.body },
  list: { gap: Spacing.sm, marginTop: Spacing.sm },
});
