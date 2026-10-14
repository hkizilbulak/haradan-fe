import type { ListingDraft } from '@/types/listing';
import type { CouponValidationResult } from '@/types/coupon';
import type { ListingTypePhase } from './listingDraftStore';

export interface EkuriListingItem {
  id: string;
  draft: ListingDraft;
  isCompleted: boolean;
  tjkPromptSeen?: boolean;
}

export type EkuriWizardStep = 'listings' | 'package' | 'checkout' | 'success';

export interface EkuriDraftState {
  step: EkuriWizardStep;
  items: EkuriListingItem[];
  selectedPackageCode: string | null;
  paymentMethod: 'CC' | 'TRANSFER';
  ekuriCode: string;
  createdBundleId: string | null;
  modalVisible?: boolean;
  editingIndex?: number | null;
  editingDraft?: ListingDraft | null;
  modalStep?: 'category' | 'details';
  categoryPhase?: ListingTypePhase;
  selectedRootSlug?: string | null;
  modalTjkPromptSeen?: boolean;
  appliedCoupon?: CouponValidationResult | null;
  updatedAt: number;
}

const STORAGE_KEY = 'haradan.ekuriWizardDraft';

function getLocalStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

function getSessionStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage;
  }
  return null;
}

export function generateEkuriCode(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `EKR-${randomNum}`;
}

export function loadEkuriDraft(): EkuriDraftState | null {
  try {
    const local = getLocalStorage();
    const session = getSessionStorage();
    const raw = local?.getItem(STORAGE_KEY) || session?.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as EkuriDraftState;
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return null;
    }

    // Do not restore already submitted drafts as active
    if (parsed.step === 'success') {
      clearEkuriDraft();
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn('Failed to load ekuri draft:', err);
    return null;
  }
}

export function saveEkuriDraft(draft: EkuriDraftState): void {
  try {
    const raw = JSON.stringify(draft);
    getLocalStorage()?.setItem(STORAGE_KEY, raw);
    getSessionStorage()?.setItem(STORAGE_KEY, raw);
  } catch (err) {
    /* quota or private mode */
  }
}

export function clearEkuriDraft(): void {
  try {
    getLocalStorage()?.removeItem(STORAGE_KEY);
    getSessionStorage()?.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasEkuriDraft(): boolean {
  const draft = loadEkuriDraft();
  if (!draft) return false;
  if (draft.step === 'package' || draft.step === 'checkout') return true;
  if (Array.isArray(draft.items)) {
    if (draft.items.length > 2) return true;
    return draft.items.some((it) => {
      const d = it.draft;
      if (!d) return false;
      if (d.type) return true;
      if (d.details?.title?.trim()) return true;
      if (d.details?.priceTl?.trim()) return true;
      if (d.media && d.media.length > 0) return true;
      if (d.details?.horseId || d.details?.sire || d.details?.dam) return true;
      return false;
    });
  }
  return false;
}
