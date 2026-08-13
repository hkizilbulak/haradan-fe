import type {
  ListingDraft,
  ListingDraftDetails,
  ListingPaymentInstructions,
  ListingWizardStep,
} from '@/types/listing';

export type ListingTypePhase = 'root' | 'category';

export type ListingWizardState = {
  step: ListingWizardStep;
  typePhase: ListingTypePhase;
  selectedRootSlug: string | null;
  draft: ListingDraft;
  tjkPromptSeen: boolean;
  detailsAttempted: boolean;
  submittedDraftId: string | null;
  payment: ListingPaymentInstructions | null;
};

const STORAGE_KEY = 'haradan.listingDraft';

export function createEmptyDetails(): ListingDraftDetails {
  return {
    title: '',
    description: '',
    priceTl: '',
    provinceId: null,
    gender: null,
    birthDate: '',
    age: '',
    coatColor: '',
    heightCm: '',
    sire: '',
    dam: '',
    damsire: '',
    registeredName: '',
    tjkId: null,
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
    payment: null,
  };
}

let state: ListingWizardState = hydrate();
const listeners = new Set<() => void>();

function hydrate(): ListingWizardState {
  if (typeof sessionStorage === 'undefined') return createInitialState();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as ListingWizardState;
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
    return {
      ...createInitialState(),
      ...parsed,
      selectedRootSlug,
      typePhase:
        typePhase === 'category' && !selectedRootSlug && !parsed.draft.type
          ? 'root'
          : typePhase,
      payment: parsed.payment ?? null,
      submittedDraftId: parsed.submittedDraftId ?? null,
      detailsAttempted: parsed.detailsAttempted === true,
      draft: {
        ...createEmptyDraft(),
        ...parsed.draft,
        details: { ...createEmptyDetails(), ...parsed.draft.details },
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
  return (
    snapshot.step === 'payment' &&
    snapshot.submittedDraftId != null &&
    snapshot.payment != null
  );
}

/** İlan Ver: süreç bitmemişse taslağı silip başa alır. */
export function prepareListingWizardEntry(): void {
  if (!isListingWizardComplete()) {
    resetListingWizard();
  }
}

export function subscribeListingWizard(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
