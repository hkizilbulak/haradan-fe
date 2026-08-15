import {
  collectCategoryIds,
  findCategoryBySlug,
} from '@/services/catalog/categoryTree';
import type { CategoryTreeNode } from '@/types';

const MAX_SERVER_CATEGORY_FANOUT = 8;

/**
 * Slug → BE categoryId listesi.
 * Tek yaprak: doğrudan server filtresi.
 * Az çocuklu ebeveyn: fan-out.
 * Çok çocuklu: server filtresi yok; client `collectCategoryIds` ile daraltır.
 */
export function resolveSearchCategoryIds(
  tree: CategoryTreeNode[],
  slug: string | null
): { serverCategoryIds: string[] | undefined; clientCategoryIds: Set<string> | null } {
  if (!slug) {
    return { serverCategoryIds: undefined, clientCategoryIds: null };
  }
  const node = findCategoryBySlug(tree, slug);
  if (!node) {
    return { serverCategoryIds: undefined, clientCategoryIds: null };
  }
  const all = collectCategoryIds(tree, slug);
  if (!all || all.size === 0) {
    return { serverCategoryIds: undefined, clientCategoryIds: null };
  }
  if (node.children.length === 0) {
    return { serverCategoryIds: [node.id], clientCategoryIds: null };
  }
  const leaves: string[] = [];
  const walk = (n: CategoryTreeNode) => {
    if (n.children.length === 0) leaves.push(n.id);
    else n.children.forEach(walk);
  };
  walk(node);
  if (leaves.length > 0 && leaves.length <= MAX_SERVER_CATEGORY_FANOUT) {
    return { serverCategoryIds: leaves, clientCategoryIds: null };
  }
  return { serverCategoryIds: undefined, clientCategoryIds: all };
}
