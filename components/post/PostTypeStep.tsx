import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostChoiceCard } from './PostChoiceCard';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import {
  getCategoryIcon,
  pickListingRootCategories,
} from '@/services/catalog/categoryDisplay';
import {
  findCategoryBySlug,
  findCategoryParent,
} from '@/services/catalog/categoryTree';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { CategoryTreeNode } from '@/types';
import type { ListingTypeSelection } from '@/types/listing';
import type { ListingTypePhase } from '@/services/listing';

function pickRoots(tree: CategoryTreeNode[]): CategoryTreeNode[] {
  return pickListingRootCategories(tree);
}

type PostTypeStepProps = {
  phase: ListingTypePhase;
  categoryTree: CategoryTreeNode[];
  selectedRootSlug: string | null;
  selectedType: ListingTypeSelection | null;
  loading?: boolean;
  error?: string | null;
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
    allowTjk: Boolean(node.allowTjk),
  };
}

export function PostTypeStep({
  phase,
  categoryTree,
  selectedRootSlug,
  selectedType,
  loading = false,
  error = null,
  onSelectRoot,
  onSelectType,
}: PostTypeStepProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const primary = useThemeColor('header');

  const [activeParentNode, setActiveParentNode] = useState<CategoryTreeNode | null>(null);

  useEffect(() => {
    if (!selectedRootSlug) {
      setActiveParentNode(null);
      return;
    }
    const found = findCategoryBySlug(categoryTree, selectedRootSlug);
    setActiveParentNode(found);
  }, [selectedRootSlug, categoryTree]);

  const roots = useMemo(() => pickRoots(categoryTree), [categoryTree]);

  const currentChildren = useMemo(() => {
    if (!activeParentNode) return roots;
    return activeParentNode.children ?? [];
  }, [activeParentNode, roots]);

  if (phase === 'category' || (activeParentNode != null && selectedRootSlug)) {
    const parentName = activeParentNode?.name ?? 'Kategori';
    return (
      <View style={styles.wrap}>
        <View style={styles.navRow}>
          <Pressable
            onPress={() => {
              if (activeParentNode && activeParentNode.slug !== selectedRootSlug) {
                const parent = findCategoryParent(categoryTree, activeParentNode.id);
                setActiveParentNode(parent);
              } else {
                setActiveParentNode(null);
                onSelectRoot({
                  categoryId: '',
                  categorySlug: '',
                  categoryName: '',
                  parentSlug: null,
                });
              }
            }}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="arrow-back" size={18} color={primary} />
            <Text style={[styles.backText, { color: primary }]}>Geri</Text>
          </Pressable>
          <Text style={[styles.breadcrumbText, { color: secondary }]} numberOfLines={1}>
            {parentName}
          </Text>
        </View>

        <Text style={[styles.kicker, { color: secondary }]}>
          Adım 1 · İlan türü
        </Text>
        <Text style={[styles.title, { color: text }]}>İlan türünü seçin</Text>
        <Text style={[styles.lead, { color: secondary }]}>
          {`${parentName} kategorisinde hangi türde ilan vereceksiniz?`}
        </Text>
        <View style={styles.list}>
          {currentChildren.length === 0 ? (
            <Text style={[styles.lead, { color: secondary }]}>
              Bu kategoride alt ilan türü bulunamadı.
            </Text>
          ) : (
            currentChildren.map((node) => {
              const hasKids = node.children && node.children.length > 0;
              return (
                <PostChoiceCard
                  key={node.id}
                  title={node.name}
                  subtitle={hasKids ? `${node.children.length} alt tür` : undefined}
                  icon={getCategoryIcon(node.slug)}
                  selected={selectedType?.categoryId === node.id}
                  onPress={() => {
                    if (hasKids) {
                      setActiveParentNode(node);
                    } else {
                      onSelectType(toSelection(node, activeParentNode?.slug ?? selectedRootSlug));
                    }
                  }}
                />
              );
            })
          )}
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
        Önce ana kategoriyi seçin.
      </Text>
      <View style={styles.list}>
        {loading ? (
          <Text style={[styles.lead, { color: secondary }]}>
            Kategoriler yükleniyor…
          </Text>
        ) : error ? (
          <Text style={[styles.lead, { color: secondary }]}>
            Kategoriler yüklenemedi. Lütfen tekrar deneyin.
          </Text>
        ) : roots.length === 0 ? (
          <Text style={[styles.lead, { color: secondary }]}>
            Kategori listesi henüz tanımlı değil.
          </Text>
        ) : (
          roots.map((node) => (
          <PostChoiceCard
            key={node.id}
            title={node.name}
            subtitle={`${node.children.length} ilan türü`}
            icon={getCategoryIcon(node.slug)}
            selected={selectedRootSlug === node.slug}
            onPress={() => {
              if (node.children.length === 0) {
                onSelectType(toSelection(node, null));
                return;
              }
              setActiveParentNode(node);
              onSelectRoot(toSelection(node, null));
            }}
          />
          ))
        )}
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  backText: {
    ...Typography.body,
    fontWeight: '600',
  },
  breadcrumbText: {
    ...Typography.body,
    fontWeight: '500',
    flex: 1,
  },
});

