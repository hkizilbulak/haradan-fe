import { MOCK_CATEGORIES } from '@/mocks/homepage';
import { getMockAdvertDetail } from '@/mocks/advertDetail';
import { MOCK_MY_LISTINGS } from '@/mocks/myListings';
import type {
  ListingDraft,
  MyListingCard,
  PublishListingResult,
} from '@/types';
import { mapAdvertToListingDraft } from './mapAdvertToListingDraft';

const STORAGE_KEY_ITEMS = 'haradan.mockMyListings.items';
const STORAGE_KEY_DRAFTS = 'haradan.mockMyListings.drafts';
const STORAGE_KEY_VERSIONS = 'haradan.mockMyListings.versions';

export const isBrowserStore =
  typeof window !== 'undefined' && typeof localStorage !== 'undefined';

function parseTlToMinor(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n * 100 : null;
}

export function readMockItems(): MyListingCard[] {
  if (!isBrowserStore) return [...MOCK_MY_LISTINGS];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(MOCK_MY_LISTINGS));
      return [...MOCK_MY_LISTINGS];
    }
    const parsed = JSON.parse(raw) as MyListingCard[];
    return Array.isArray(parsed) ? parsed : [...MOCK_MY_LISTINGS];
  } catch {
    return [...MOCK_MY_LISTINGS];
  }
}

export function writeMockItems(items: MyListingCard[]): void {
  if (!isBrowserStore) return;
  try {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export function readMockDrafts(): Record<string, ListingDraft> {
  if (!isBrowserStore) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DRAFTS);
    if (!raw) return {};
    return (JSON.parse(raw) as Record<string, ListingDraft>) || {};
  } catch {
    return {};
  }
}

export function writeMockDraft(id: string, draft: ListingDraft): void {
  if (!isBrowserStore) return;
  try {
    const current = readMockDrafts();
    current[id] = draft;
    localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(current));
  } catch {
    /* ignore */
  }
}

export function removeMockDraftFromStore(id: string): void {
  if (!isBrowserStore) return;
  try {
    const current = readMockDrafts();
    delete current[id];
    localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(current));
  } catch {
    /* ignore */
  }
}

export function readMockVersions(): Record<string, number> {
  if (!isBrowserStore) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VERSIONS);
    if (!raw) return {};
    return (JSON.parse(raw) as Record<string, number>) || {};
  } catch {
    return {};
  }
}

export function writeMockVersion(id: string, version: number): void {
  if (!isBrowserStore) return;
  try {
    const current = readMockVersions();
    current[id] = version;
    localStorage.setItem(STORAGE_KEY_VERSIONS, JSON.stringify(current));
  } catch {
    /* ignore */
  }
}

export function removeMockVersionFromStore(id: string): void {
  if (!isBrowserStore) return;
  try {
    const current = readMockVersions();
    delete current[id];
    localStorage.setItem(STORAGE_KEY_VERSIONS, JSON.stringify(current));
  } catch {
    /* ignore */
  }
}

export function addMockListingFromDraft(draft: ListingDraft): PublishListingResult {
  const newId = `adv-${Date.now().toString(36)}`;
  const coverSlot = draft.media?.find((m) => m.isCover) ?? draft.media?.[0];
  const title = draft.details.title.trim() || 'Yeni İlan';
  const pkgCode = draft.packageCode?.trim() || 'STANDARD';
  const isPremium = pkgCode === 'PREMIUM';
  const isUltimate = pkgCode === 'ULTIMATE';
  const now = new Date().toISOString();

  const card: MyListingCard = {
    id: newId,
    title,
    status: 'pending',
    backendStatus: 'PENDING_REVIEW',
    price: {
      amountMinor: parseTlToMinor(draft.details.priceTl) ?? 10000000,
      currency: 'TRY',
    },
    cover: coverSlot
      ? {
          assetId: coverSlot.assetId ?? coverSlot.localId,
          displayOrder: 0,
          isCover: true,
          publicUrl: coverSlot.uri,
          usage: 'cover',
        }
      : null,
    categoryId: draft.type?.categorySlug || draft.type?.categoryId || 'satilik-yaris-ati',
    provinceId: draft.details.provinceId || '34',
    districtId: draft.details.districtId || '3401',
    horseId: draft.details.horseId ?? null,
    packageCode: pkgCode,
    packageDisplayName: isUltimate ? 'Ultimate' : isPremium ? 'Premium' : 'Standart',
    packageBadgeText: isPremium ? 'Önerilen' : null,
    isUrgent: isPremium || isUltimate,
    urgentActivatedAt: isPremium || isUltimate ? now : null,
    isFeatured: isPremium || isUltimate,
    featuredUntil: isUltimate
      ? new Date(Date.now() + 30 * 86400000).toISOString()
      : isPremium
        ? new Date(Date.now() + 7 * 86400000).toISOString()
        : null,
    isFavorite: false,
    viewCount: 0,
    rating: 5,
    reviewCount: 0,
    oldPrice: null,
    available: 1,
    brand: draft.breed?.label || draft.details.breeder || null,
    updatedAt: now,
    publishedAt: now,
    soldAt: null,
    version: 1,
    sellerId: 'user-demo',
  };

  const items = readMockItems();
  items.unshift(card);
  writeMockItems(items);
  writeMockDraft(newId, draft);
  writeMockVersion(newId, 1);

  return {
    advertId: newId,
    status: 'PENDING_REVIEW',
  };
}

export function getOrCreateMockDraft(
  id: string,
  card: MyListingCard
): ListingDraft {
  const drafts = readMockDrafts();
  if (drafts[id]) {
    return drafts[id];
  }
  const detail = getMockAdvertDetail(id);
  const draft = mapAdvertToListingDraft(detail, card, MOCK_CATEGORIES);
  writeMockDraft(id, draft);
  writeMockVersion(id, card.version ?? 1);
  return draft;
}
