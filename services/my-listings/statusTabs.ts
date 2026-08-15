import type { MyListingStatus } from '@/types';

/** Sekme sırası — Yayında yanına İncelemede / Reddedildi. */
export const MY_LISTING_TABS: {
  key: MyListingStatus;
  label: string;
}[] = [
  { key: 'published', label: 'Yayında' },
  { key: 'pending', label: 'İncelemede' },
  { key: 'rejected', label: 'Reddedildi' },
  { key: 'draft', label: 'Taslak' },
  { key: 'sold', label: 'Satılmış' },
];

/** BE AdvertStatus → İlanlarım sekmesi. */
export function toMyListingTab(backendStatus: string): MyListingStatus {
  switch (backendStatus) {
    case 'PUBLISHED':
      return 'published';
    case 'PENDING_REVIEW':
      return 'pending';
    case 'REJECTED':
      return 'rejected';
    case 'SOLD':
      return 'sold';
    default:
      // DRAFT | CHANGES_REQUESTED | SUSPENDED | ARCHIVED
      return 'draft';
  }
}

/** Sekme → BE status filtreleri (ListMyAdverts tek status; fan-out burada). */
export function backendStatusesForTab(tab: MyListingStatus): string[] {
  switch (tab) {
    case 'published':
      return ['PUBLISHED'];
    case 'pending':
      return ['PENDING_REVIEW'];
    case 'rejected':
      return ['REJECTED'];
    case 'sold':
      return ['SOLD'];
    case 'draft':
      return ['DRAFT', 'CHANGES_REQUESTED', 'SUSPENDED', 'ARCHIVED'];
  }
}
