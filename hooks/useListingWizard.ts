import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  canEnterStep,
  detailsErrors,
  detailsStepComplete,
  getListingWizardState,
  mapDraftToRequest,
  packageStepComplete,
  setListingWizardState,
  subscribeListingWizard,
  listingRepository,
  type IListingRepository,
  type ListingTypePhase,
} from '@/services/listing';
import { mediaUploader, type IMediaUploader } from '@/services/media';
import { tjkRepository, type ITjkRepository } from '@/services/tjk';
import type {
  ListingDraftDetails,
  ListingMediaSlot,
  ListingPackageCode,
  ListingPaymentInstructions,
  ListingTypeSelection,
  ListingWizardStep,
  TjkHorseProfile,
} from '@/types/listing';

type Deps = {
  listingRepo?: IListingRepository;
  media?: IMediaUploader;
  tjk?: ITjkRepository;
};

const STEPS: ListingWizardStep[] = ['type', 'details', 'package', 'payment'];

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
    tjkId: horse.tjkId,
    tjkSkipped: false,
    title: details.title.trim() || horse.registeredName,
  };
}

export function useListingWizard(deps: Deps = {}) {
  const listingRepo = deps.listingRepo ?? listingRepository;
  const media = deps.media ?? mediaUploader;
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
    payment,
  } = state;
  const fieldErrors = useMemo(
    () => (detailsAttempted ? detailsErrors(draft) : {}),
    [draft, detailsAttempted]
  );

  const canNext = useMemo(() => {
    if (step === 'type') return false;
    if (step === 'details') return true;
    if (step === 'package') return packageStepComplete(draft);
    return submittedDraftId != null;
  }, [draft, step, submittedDraftId]);

  const patchDraft = useCallback(
    (partial: Partial<typeof draft>) => {
      setListingWizardState((prev) => ({
        ...prev,
        draft: { ...prev.draft, ...partial },
        submittedDraftId: null,
        payment: null,
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
      payment: null,
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
      payment: null,
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

  const applyTjk = useCallback(async (tjkId: string) => {
    const horse = await tjk.getById(tjkId);
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
        details: { ...prev.draft.details, tjkSkipped: true, tjkId: null },
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

  const submitDraft = useCallback(
    async (accessToken: string): Promise<ListingPaymentInstructions> => {
      const current = getListingWizardState();
      const uploaded = await Promise.all(
        current.draft.media.map(async (slot) => {
          if (slot.assetId) return slot;
          const res = await media.upload(
            {
              uri: slot.uri,
              mimeType: slot.mimeType,
              fileName: slot.fileName,
            },
            accessToken
          );
          return { ...slot, assetId: res.assetId, uri: res.publicUrl };
        })
      );
      setListingWizardState((prev) => ({
        ...prev,
        draft: { ...prev.draft, media: uploaded },
      }));
      const payload = mapDraftToRequest({
        ...current.draft,
        media: uploaded,
      });
      const created = await listingRepo.createDraft(payload, accessToken);
      const payment = await listingRepo.getPaymentInstructions(
        created.draftId,
        accessToken
      );
      setListingWizardState((prev) => ({
        ...prev,
        submittedDraftId: created.draftId,
        payment,
        step: 'payment',
      }));
      return payment;
    },
    [listingRepo, media]
  );

  return {
    draft,
    step,
    typePhase,
    selectedRootSlug,
    tjkPromptSeen,
    detailsAttempted,
    submittedDraftId,
    payment,
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
    submitDraft,
  };
}
