import type { MyListingStatus } from '@/types';

/** Sekme sırası — Yayında yanına Yayından Kaldırılanlar. */
export const MY_LISTING_TABS: {
  key: MyListingStatus;
  label: string;
}[] = [
  { key: 'published', label: 'Yayında' },
  { key: 'sold', label: 'Yayından Kaldırılanlar' },
  { key: 'pending', label: 'İncelemede' },
  { key: 'draft', label: 'Taslak' },
  { key: 'rejected', label: 'Reddedildi' },
];

/** BE AdvertStatus → İlanlarım sekmesi. */
export function toMyListingTab(backendStatus: string): MyListingStatus {
  switch (backendStatus) {
    case 'PUBLISHED':
      return 'published';
    case 'ARCHIVED':
    case 'SOLD':
      return 'sold';
    case 'PENDING_REVIEW':
      return 'pending';
    case 'REJECTED':
      return 'rejected';
    default:
      // DRAFT | CHANGES_REQUESTED | SUSPENDED
      return 'draft';
  }
}

/** ADVERT-OWNER-09 owner soft-delete. */
export function canSoftDeleteDraft(_backendStatus: string): boolean {
  return true;
}

/** Sekme → BE status filtreleri (ListMyAdverts tek status; fan-out burada). */
export function backendStatusesForTab(tab: MyListingStatus): string[] {
  switch (tab) {
    case 'published':
      return ['PUBLISHED'];
    case 'sold':
      return ['ARCHIVED', 'SOLD'];
    case 'pending':
      return ['PENDING_REVIEW'];
    case 'rejected':
      return ['REJECTED'];
    case 'draft':
      return ['DRAFT', 'CHANGES_REQUESTED', 'SUSPENDED'];
  }
}
