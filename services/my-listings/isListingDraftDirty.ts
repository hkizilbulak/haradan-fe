import type { ListingDraft } from '@/types/listing';

function arePrimitivesEqual(valA: unknown, valB: unknown): boolean {
  if (typeof valA === 'boolean' || typeof valB === 'boolean') {
    return Boolean(valA) === Boolean(valB);
  }
  const sA = valA == null ? '' : String(valA).trim();
  const sB = valB == null ? '' : String(valB).trim();
  return sA === sB;
}

/**
 * İki ListingDraft nesnesini içerik olarak karşılaştırır.
 * Boşluklar, null/undefined eşdeğerlikleri ve dinamik properties dikkate alınır.
 */
export function areListingDraftsEqual(
  a: ListingDraft | null | undefined,
  b: ListingDraft | null | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  // 1. Details karşılaştırması
  const detailsA = a.details || ({} as ListingDraft['details']);
  const detailsB = b.details || ({} as ListingDraft['details']);
  const allDetailKeys = new Set([
    ...Object.keys(detailsA),
    ...Object.keys(detailsB),
  ]);

  for (const key of allDetailKeys) {
    const valA = (detailsA as Record<string, unknown>)[key];
    const valB = (detailsB as Record<string, unknown>)[key];

    if (key === 'properties') {
      const propsA = (valA as Record<string, unknown>) || {};
      const propsB = (valB as Record<string, unknown>) || {};
      const allPropKeys = new Set([
        ...Object.keys(propsA),
        ...Object.keys(propsB),
      ]);
      for (const pk of allPropKeys) {
        const pA = propsA[pk];
        const pB = propsB[pk];
        if (
          typeof pA === 'object' &&
          pA !== null &&
          typeof pB === 'object' &&
          pB !== null
        ) {
          if (JSON.stringify(pA) !== JSON.stringify(pB)) return false;
        } else if (!arePrimitivesEqual(pA, pB)) {
          return false;
        }
      }
      continue;
    }

    if (
      typeof valA === 'object' &&
      valA !== null &&
      typeof valB === 'object' &&
      valB !== null
    ) {
      if (JSON.stringify(valA) !== JSON.stringify(valB)) return false;
    } else if (!arePrimitivesEqual(valA, valB)) {
      return false;
    }
  }

  // 2. Media karşılaştırması (sıra, adet, cover, assetId veya uri)
  const mediaA = a.media || [];
  const mediaB = b.media || [];
  if (mediaA.length !== mediaB.length) return false;

  for (let i = 0; i < mediaA.length; i++) {
    const itemA = mediaA[i];
    const itemB = mediaB[i];
    if (itemA.uri !== itemB.uri) return false;
    if (Boolean(itemA.isCover) !== Boolean(itemB.isCover)) return false;
    if ((itemA.assetId ?? null) !== (itemB.assetId ?? null)) return false;
  }

  // 3. Package code
  if (!arePrimitivesEqual(a.packageCode, b.packageCode)) {
    return false;
  }

  return true;
}

/**
 * Mevcut taslağın ilk yüklenen taslağa göre değişip değişmediğini kontrol eder.
 */
export function isListingDraftDirty(
  current: ListingDraft | null | undefined,
  initial: ListingDraft | null | undefined
): boolean {
  if (!current || !initial) return false;
  return !areListingDraftsEqual(current, initial);
}
