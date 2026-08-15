import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  canEnterStep,
  detailsErrors,
  detailsStepComplete,
  getListingWizardState,
  setListingWizardState,
  subscribeListingWizard,
  listingRepository,
  type IListingRepository,
  type ListingTypePhase,
} from '@/services/listing';
import { tjkRepository, type ITjkRepository } from '@/services/tjk';
import type {
  ListingDraftDetails,
  ListingMediaSlot,
  ListingPackageCode,
  ListingTypeSelection,
  ListingWizardStep,
  PublishListingResult,
  TjkHorseProfile,
} from '@/types/listing';

type Deps = {
  listingRepo?: IListingRepository;
  tjk?: ITjkRepository;
};

const STEPS: ListingWizardStep[] = ['type', 'details', 'package', 'review'];

export function applyTjkProfile(
  details: ListingDraftDetails,
  horse: TjkHorseProfile
): ListingDraftDetails {
  return {
    ...details,
    registeredName: horse.registeredName,
    gender: horse.gender,
    birthDate: horse.birthDate,
    age: String(horse.age),
    coatColor: horse.coatColor,
    heightCm: horse.heightCm != null ? String(horse.heightCm) : '',
    sire: horse.sire,
    dam: horse.dam,
    damsire: horse.damsire,
    ownersText: horse.owners.join(', '),
    breeder: horse.breeder,
    trainer: horse.trainer,
    horseId: horse.horseId,
    tjkNumber: horse.tjkNumber,
    tjkSkipped: false,
    title: details.title.trim() || horse.registeredName,
  };
}

export function useListingWizard(deps: Deps = {}) {
  const listingRepo = deps.listingRepo ?? listingRepository;
  const tjk = deps.tjk ?? tjkRepository;

  const state = useSyncExternalStore(
    subscribeListingWizard,
    getListingWizardState,
    getListingWizardState
  );

  const {
    draft,
    step,
    typePhase,
    selectedRootSlug,
    tjkPromptSeen,
    detailsAttempted,
    submittedDraftId,
    submittedStatus,
  } = state;
  const fieldErrors = useMemo(
    () => (detailsAttempted ? detailsErrors(draft) : {}),
    [draft, detailsAttempted]
  );

  const canNext = useMemo(() => {
    if (step === 'type') return false;
    if (step === 'details') return true;
    if (step === 'package') return true;
    return submittedDraftId != null;
  }, [step, submittedDraftId]);

  const patchDraft = useCallback(
    (partial: Partial<typeof draft>) => {
      setListingWizardState((prev) => ({
        ...prev,
        draft: { ...prev.draft, ...partial },
        submittedDraftId: null,
        submittedStatus: null,
      }));
    },
    []
  );

  const setStep = useCallback((next: ListingWizardStep) => {
    setListingWizardState((prev) => {
      if (!canEnterStep(prev.draft, next)) return prev;
      return { ...prev, step: next };
    });
  }, []);

  const setTypePhase = useCallback((phase: ListingTypePhase) => {
    setListingWizardState((prev) => ({ ...prev, typePhase: phase }));
  }, []);

  const selectRoot = useCallback((root: ListingTypeSelection) => {
    setListingWizardState((prev) => ({
      ...prev,
      typePhase: 'category',
      selectedRootSlug: root.categorySlug,
      submittedDraftId: null,
      submittedStatus: null,
      draft: { ...prev.draft, type: null, breed: null },
    }));
  }, []);

  const selectType = useCallback((type: ListingTypeSelection) => {
    setListingWizardState((prev) => ({
      ...prev,
      step: 'details',
      typePhase: 'category',
      tjkPromptSeen: false,
      detailsAttempted: false,
      submittedDraftId: null,
      submittedStatus: null,
      draft: { ...prev.draft, type, breed: null },
    }));
  }, []);

  const updateDetails = useCallback(
    (partial: Partial<ListingDraftDetails>) => {
      setListingWizardState((prev) => ({
        ...prev,
        draft: {
          ...prev.draft,
          details: { ...prev.draft.details, ...partial },
        },
      }));
    },
    []
  );

  const setMedia = useCallback((mediaSlots: ListingMediaSlot[]) => {
    patchDraft({ media: mediaSlots });
  }, [patchDraft]);

  const setCover = useCallback((localId: string) => {
    setListingWizardState((prev) => ({
      ...prev,
      draft: {
        ...prev.draft,
        media: prev.draft.media.map((m) => ({
          ...m,
          isCover: m.localId === localId,
        })),
      },
    }));
  }, []);

  const selectPackage = useCallback((code: ListingPackageCode) => {
    patchDraft({ packageCode: code });
  }, [patchDraft]);

  const markTjkPromptSeen = useCallback(() => {
    setListingWizardState((prev) => ({ ...prev, tjkPromptSeen: true }));
  }, []);

  const applyTjk = useCallback(async (horseId: string) => {
    const horse = await tjk.getById(horseId);
    if (!horse) return;
    setListingWizardState((prev) => ({
      ...prev,
      tjkPromptSeen: true,
      draft: {
        ...prev.draft,
        details: applyTjkProfile(prev.draft.details, horse),
      },
    }));
  }, [tjk]);

  const skipTjk = useCallback(() => {
    setListingWizardState((prev) => ({
      ...prev,
      tjkPromptSeen: true,
      draft: {
        ...prev.draft,
        details: {
          ...prev.draft.details,
          tjkSkipped: true,
          horseId: null,
          tjkNumber: null,
        },
      },
    }));
  }, []);

  const goNext = useCallback(() => {
    setListingWizardState((prev) => {
      if (prev.step === 'type' && prev.typePhase === 'root' && prev.selectedRootSlug) {
        return { ...prev, typePhase: 'category' };
      }
      if (prev.step === 'type' && prev.typePhase === 'category' && prev.draft.type) {
        return { ...prev, step: 'details', detailsAttempted: false, tjkPromptSeen: false };
      }
      if (prev.step === 'details') {
        if (!detailsStepComplete(prev.draft)) {
          return { ...prev, detailsAttempted: true };
        }
        return { ...prev, step: 'package', detailsAttempted: false };
      }
      const idx = STEPS.indexOf(prev.step);
      const next = STEPS[idx + 1];
      if (!next || !canEnterStep(prev.draft, next)) return prev;
      return { ...prev, step: next };
    });
  }, []);

  const goBack = useCallback(() => {
    setListingWizardState((prev) => {
      if (prev.step === 'type' && prev.typePhase === 'category') {
        return {
          ...prev,
          typePhase: 'root',
          draft: { ...prev.draft, type: null, breed: null },
        };
      }
      const idx = STEPS.indexOf(prev.step);
      const prevStep = STEPS[idx - 1];
      if (!prevStep) return prev;
      return {
        ...prev,
        step: prevStep,
        typePhase:
          prevStep === 'type'
            ? prev.draft.type
              ? 'category'
              : 'root'
            : prev.typePhase,
      };
    });
  }, []);

  const publishListing = useCallback(
    async (accessToken: string): Promise<PublishListingResult> => {
      const current = getListingWizardState();
      const created = await listingRepo.publish(current.draft, accessToken);
      setListingWizardState((prev) => ({
        ...prev,
        submittedDraftId: created.advertId,
        submittedStatus: created.status,
        step: 'review',
      }));
      return created;
    },
    [listingRepo]
  );

  return {
    draft,
    step,
    typePhase,
    selectedRootSlug,
    tjkPromptSeen,
    detailsAttempted,
    submittedDraftId,
    submittedStatus,
    fieldErrors,
    canNext,
    setStep,
    setTypePhase,
    selectRoot,
    selectType,
    updateDetails,
    setMedia,
    setCover,
    selectPackage,
    markTjkPromptSeen,
    applyTjk,
    skipTjk,
    goNext,
    goBack,
    publishListing,
  };
}
