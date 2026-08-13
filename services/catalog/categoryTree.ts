import type { CategoryTreeNode } from '@/types';

export function findCategoryBySlug(
  nodes: CategoryTreeNode[],
  slug: string
): CategoryTreeNode | null {
  for (const n of nodes) {
    if (n.slug === slug) return n;
    const child = findCategoryBySlug(n.children, slug);
    if (child) return child;
  }
  return null;
}

export function collectCategoryIds(
  tree: CategoryTreeNode[],
  slug: string
): Set<string> | null {
  const found = findCategoryBySlug(tree, slug);
  if (!found) return null;
  const ids = new Set<string>();
  const walk = (n: CategoryTreeNode) => {
    ids.add(n.id);
    n.children.forEach(walk);
  };
  walk(found);
  return ids;
}

export function findCategoryById(
  nodes: CategoryTreeNode[],
  id: string
): CategoryTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const child = findCategoryById(n.children, id);
    if (child) return child;
  }
  return null;
}

export function findCategoryParent(
  nodes: CategoryTreeNode[],
  idOrSlug: string
): CategoryTreeNode | null {
  for (const n of nodes) {
    if (
      n.children.some((c) => c.id === idOrSlug || c.slug === idOrSlug)
    ) {
      return n;
    }
    const inner = findCategoryParent(n.children, idOrSlug);
    if (inner) return inner;
  }
  return null;
}

export function categoryLabel(
  tree: CategoryTreeNode[],
  slug: string | null
): string | null {
  if (!slug) return null;
  return findCategoryBySlug(tree, slug)?.name ?? null;
}
