import type {
  ListingDraft,
  ListingDraftDetails,
  ListingWizardStep,
} from '@/types/listing';
import {
  isListingPackageStepEnabled,
  isPaytrCheckoutEnabled,
} from '@/constants/Paytr';

export type ListingTypePhase = 'root' | 'category';

export type ListingWizardState = {
  step: ListingWizardStep;
  typePhase: ListingTypePhase;
  selectedRootSlug: string | null;
  draft: ListingDraft;
  tjkPromptSeen: boolean;
  detailsAttempted: boolean;
  submittedDraftId: string | null;
  submittedStatus: string | null;
  paytrMerchantOid: string | null;
  paytrIframeUrl: string | null;
};

const STORAGE_KEY = 'haradan.listingDraft';

export function createEmptyDetails(): ListingDraftDetails {
  return {
    title: '',
    description: '',
    priceTl: '',
    provinceId: null,
    districtId: null,
    address: '',
    gender: null,
    birthDate: '',
    age: '',
    coatColor: '',
    heightCm: '',
    sire: '',
    dam: '',
    damsire: '',
    registeredName: '',
    horseId: null,
    tjkNumber: null,
    tjkSkipped: false,
    ownersText: '',
    breeder: '',
    trainer: '',
    phoneCountryIso: 'TR',
    sellerPhone: '',
  };
}

export function createEmptyDraft(): ListingDraft {
  return {
    type: null,
    breed: null,
    details: createEmptyDetails(),
    media: [],
    packageCode: null,
  };
}

function createInitialState(): ListingWizardState {
  return {
    step: 'type',
    typePhase: 'root',
    selectedRootSlug: null,
    draft: createEmptyDraft(),
    tjkPromptSeen: false,
    detailsAttempted: false,
    submittedDraftId: null,
    submittedStatus: null,
    paytrMerchantOid: null,
    paytrIframeUrl: null,
  };
}

let state: ListingWizardState = hydrate();
const listeners = new Set<() => void>();

function normalizeStep(raw: unknown): ListingWizardStep {
  if (raw === 'review') return 'review';
  if (raw === 'payment') {
    if (isPaytrCheckoutEnabled()) return 'payment';
    return isListingPackageStepEnabled() ? 'package' : 'details';
  }
  if (raw === 'package') {
    return isListingPackageStepEnabled() ? 'package' : 'details';
  }
  if (raw === 'details' || raw === 'type') return raw;
  return 'type';
}

function hydrate(): ListingWizardState {
  if (typeof sessionStorage === 'undefined') return createInitialState();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as ListingWizardState & {
      payment?: unknown;
      draft?: ListingDraft & { details?: ListingDraftDetails & { tjkId?: string } };
    };
    if (!parsed?.draft) return createInitialState();
    const media = (parsed.draft.media ?? []).filter(
      (m) => m.uri && !m.uri.startsWith('blob:')
    );
    const selectedRootSlug =
      parsed.selectedRootSlug ?? parsed.draft.type?.parentSlug ?? null;
    const rawPhase = parsed.typePhase as string;
    const typePhase: ListingTypePhase =
      rawPhase === 'category' || rawPhase === 'root'
        ? rawPhase
        : rawPhase === 'breed'
          ? 'category'
          : 'root';
    const details = parsed.draft.details ?? createEmptyDetails();
    const horseId =
      details.horseId ??
      (typeof (details as { tjkId?: string }).tjkId === 'string'
        ? (details as { tjkId?: string }).tjkId ?? null
        : null);
    return {
      ...createInitialState(),
      ...parsed,
      step: normalizeStep(parsed.step),
      selectedRootSlug,
      typePhase:
        typePhase === 'category' && !selectedRootSlug && !parsed.draft.type
          ? 'root'
          : typePhase,
      submittedDraftId: parsed.submittedDraftId ?? null,
      submittedStatus: parsed.submittedStatus ?? null,
      paytrMerchantOid: parsed.paytrMerchantOid ?? null,
      paytrIframeUrl: parsed.paytrIframeUrl ?? null,
      detailsAttempted: parsed.detailsAttempted === true,
      draft: {
        ...createEmptyDraft(),
        ...parsed.draft,
        details: {
          ...createEmptyDetails(),
          ...details,
          horseId,
          districtId: details.districtId ?? null,
          tjkNumber: details.tjkNumber ?? null,
        },
        media,
      },
    };
  } catch {
    return createInitialState();
  }
}

function persist(next: ListingWizardState): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

function emit(next: ListingWizardState): void {
  state = next;
  persist(next);
  listeners.forEach((l) => l());
}

export function getListingWizardState(): ListingWizardState {
  return state;
}

export function setListingWizardState(
  patch: Partial<ListingWizardState> | ((prev: ListingWizardState) => ListingWizardState)
): void {
  const next = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
  emit(next);
}

export function resetListingWizard(): void {
  emit(createInitialState());
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function isListingWizardComplete(
  snapshot: ListingWizardState = state
): boolean {
  return snapshot.step === 'review' && snapshot.submittedDraftId != null;
}

/**
 * İlan Ver giriş noktası: her tıklamada sihirbazı sıfırlar.
 * Gönderilmiş başarı ekranı veya yarım taslak kalıntısı taşınmaz.
 */
export function prepareListingWizardEntry(): void {
  resetListingWizard();
}

export function subscribeListingWizard(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
