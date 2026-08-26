import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  canEnterStep,
  detailsErrors,
  detailsStepComplete,
  packageStepComplete,
  getListingWizardState,
  setListingWizardState,
  subscribeListingWizard,
  listingRepository,
  isPaytrCheckoutEnabled,
  isListingPackageStepEnabled,
  isSaleHorseListing,
  DEFAULT_LISTING_PACKAGE_CODE,
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

const STEPS_FULL: ListingWizardStep[] = [
  'type',
  'details',
  'package',
  'payment',
  'review',
];

const STEPS_PACKAGE_ONLY: ListingWizardStep[] = [
  'type',
  'details',
  'package',
  'review',
];

/** TEMP: skip package + payment until PayTR is live. */
const STEPS_DIRECT: ListingWizardStep[] = ['type', 'details', 'review'];

function wizardSteps(): ListingWizardStep[] {
  if (!isListingPackageStepEnabled()) return STEPS_DIRECT;
  return isPaytrCheckoutEnabled() ? STEPS_FULL : STEPS_PACKAGE_ONLY;
}

export function normalizeTjkAge(rawAge: number | string | undefined): string {
  if (rawAge == null || rawAge === '') return '';
  const str = String(rawAge).trim();
  if (str.includes('Yaş') || str.includes('Tay')) return str;
  const num = parseInt(str, 10);
  if (isNaN(num)) return str;
  if (num <= 1) return 'Tay (0-1 Yaş)';
  if (num === 2) return '2 Yaş';
  if (num === 3) return '3 Yaş';
  if (num === 4) return '4 Yaş';
  return '5+ Yaş';
}

export function normalizeTjkGender(rawGender: string | null | undefined): string {
  if (!rawGender) return '';
  const g = rawGender.trim().replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
  if (g.startsWith('e')) return 'Erkek';
  if (g.startsWith('d')) return 'Dişi';
  if (g.startsWith('i') || g.startsWith('ı')) return 'İğdiş';
  return rawGender.trim();
}

export function normalizeTjkBreed(rawBreed: string | undefined): string {
  if (!rawBreed) return '';
  const b = rawBreed.trim().replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
  if (b.includes('ingiliz')) return 'İngiliz (Thoroughbred)';
  if (b.includes('arap')) return 'Safkan Arap';
  return rawBreed.trim();
}

export function applyTjkProfile(
  details: ListingDraftDetails,
  horse: TjkHorseProfile
): ListingDraftDetails {
  const existingProps = { ...(details.properties || {}) };

  // Remove any lowercase keys that might conflict with strict backend validation
  delete existingProps['coatColor'];
  delete existingProps['gender'];
  delete existingProps['age'];
  delete existingProps['breed'];

  const normalizedAge = normalizeTjkAge(horse.age);
  const normalizedGender = normalizeTjkGender(horse.gender);
  const normalizedBreed = normalizeTjkBreed(horse.breed);

  // Sync TJK fields directly to canonical property codes
  if (horse.coatColor) {
    existingProps['COAT_COLOR'] = horse.coatColor;
  }
  if (normalizedGender) {
    existingProps['HORSE_GENDER'] = normalizedGender;
  }
  if (normalizedAge) {
    existingProps['HORSE_AGE'] = normalizedAge;
  }
  if (normalizedBreed) {
    existingProps['HORSE_BREED'] = normalizedBreed;
  }

  return {
    ...details,
    registeredName: horse.registeredName,
    gender: normalizedGender as any || horse.gender,
    birthDate: horse.birthDate,
    age: normalizedAge || String(horse.age),
    coatColor: horse.coatColor,
    breed: normalizedBreed || horse.breed,
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
    properties: existingProps,
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
    categoryProperties,
    step,
    typePhase,
    selectedRootSlug,
    tjkPromptSeen,
    detailsAttempted,
    submittedDraftId,
    submittedStatus,
    paytrMerchantOid,
    paytrIframeUrl,
  } = state;
  const fieldErrors = useMemo(
    () => (detailsAttempted ? detailsErrors(draft, categoryProperties || undefined) : {}),
    [draft, detailsAttempted, categoryProperties]
  );

  const canNext = useMemo(() => {
    if (step === 'type') return false;
    if (step === 'details') return true;
    if (step === 'package') return packageStepComplete(draft);
    if (step === 'payment') return false;
    return submittedDraftId != null;
  }, [step, draft, submittedDraftId]);

  const patchDraft = useCallback(
    (partial: Partial<typeof draft>) => {
      setListingWizardState((prev) => ({
        ...prev,
        draft: { ...prev.draft, ...partial },
        submittedDraftId: null,
        submittedStatus: null,
        paytrMerchantOid: null,
        paytrIframeUrl: null,
      }));
    },
    []
  );

  const setStep = useCallback((next: ListingWizardStep) => {
    setListingWizardState((prev) => {
      if (!canEnterStep(prev.draft, next, prev.categoryProperties || undefined)) return prev;
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
    setListingWizardState((prev) => {
      const isDifferentCategory = prev.draft.type?.categoryId !== type.categoryId;
      const isNewSaleHorse = isSaleHorseListing(type);
      return {
        ...prev,
        step: 'details',
        typePhase: 'category',
        tjkPromptSeen: false,
        detailsAttempted: false,
        submittedDraftId: null,
        submittedStatus: null,
        draft: {
          ...prev.draft,
          type,
          breed: null,
          details: isDifferentCategory
            ? {
                ...prev.draft.details,
                properties: {},
                ...(isNewSaleHorse
                  ? {}
                  : {
                      horseId: null,
                      tjkNumber: null,
                      tjkSkipped: false,
                      registeredName: '',
                      gender: undefined,
                      breed: '',
                      age: '',
                      coatColor: '',
                      birthDate: '',
                      heightCm: '',
                      sire: '',
                      dam: '',
                      damsire: '',
                      ownersText: '',
                      breeder: '',
                      trainer: '',
                    }),
                facilityGrassPaddock: false,
                facilitySandPaddock: false,
                facilityStallionPaddock: false,
                facilityTrainingTrack: '',
                facilityVeterinarian: false,
                facilityFarrier: false,
                facilityFoalingBarn: false,
                companyName: '',
                websiteUrl: '',
                studBreed: '',
                studAge: '',
                studCoatColor: '',
                studHorseName: '',
                studSire: '',
                studDam: '',
                studDamsire: '',
              }
            : prev.draft.details,
        },
      };
    });
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
    let next = mediaSlots;
    if (next.length > 0 && !next.some((m) => m.isCover)) {
      next = next.map((m, i) => (i === 0 ? { ...m, isCover: true } : m));
    }
    patchDraft({ media: next });
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
        if (!detailsStepComplete(prev.draft, prev.categoryProperties || undefined)) {
          return { ...prev, detailsAttempted: true };
        }
        if (!isListingPackageStepEnabled()) {
          return { ...prev, detailsAttempted: false };
        }
        return { ...prev, step: 'package', detailsAttempted: false };
      }
      const steps = wizardSteps();
      const idx = steps.indexOf(prev.step);
      const next = steps[idx + 1];
      if (!next || !canEnterStep(prev.draft, next, prev.categoryProperties || undefined)) return prev;
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
      const steps = wizardSteps();
      const idx = steps.indexOf(prev.step);
      const prevStep = steps[idx - 1];
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
      const draft = {
        ...current.draft,
        packageCode:
          current.draft.packageCode?.trim() || DEFAULT_LISTING_PACKAGE_CODE,
      };
      if (draft.packageCode !== current.draft.packageCode) {
        setListingWizardState((prev) => ({
          ...prev,
          draft: { ...prev.draft, packageCode: draft.packageCode },
        }));
      }
      const created = await listingRepo.publish(draft, accessToken);
      setListingWizardState((prev) => ({
        ...prev,
        submittedDraftId: created.advertId,
        submittedStatus: created.status,
        step: 'review',
        paytrMerchantOid: null,
        paytrIframeUrl: null,
      }));
      return created;
    },
    [listingRepo]
  );

  /** Create draft then open PayTR iframe checkout (only when flag enabled). */
  const startPaidCheckout = useCallback(
    async (accessToken: string) => {
      if (!isPaytrCheckoutEnabled()) {
        return publishListing(accessToken);
      }
      const current = getListingWizardState();
      const packageCode = current.draft.packageCode?.trim();
      if (!packageCode) {
        throw new Error('Paket seçilmedi.');
      }
      if (!listingRepo.createDraft || !listingRepo.startPaytrCheckout) {
        return publishListing(accessToken);
      }
      const draft = await listingRepo.createDraft(current.draft, accessToken);
      try {
        const checkout = await listingRepo.startPaytrCheckout(
          draft.advertId,
          packageCode,
          accessToken
        );
        setListingWizardState((prev) => ({
          ...prev,
          submittedDraftId: draft.advertId,
          submittedStatus: draft.status,
          paytrMerchantOid: checkout.merchantOid,
          paytrIframeUrl: checkout.iframeUrl,
          step: 'payment',
        }));
        return checkout;
      } catch (err: unknown) {
        const is404 =
          err instanceof Error &&
          (err.message.includes('404') || err.message.includes('bulunamadı'));
        if (is404) {
          const published = await listingRepo.publish(current.draft, accessToken);
          setListingWizardState((prev) => ({
            ...prev,
            submittedDraftId: published.advertId,
            submittedStatus: published.status,
            step: 'review',
            paytrMerchantOid: null,
            paytrIframeUrl: null,
          }));
          return;
        }
        throw err;
      }
    },
    [listingRepo, publishListing]
  );

  const markPaymentSucceeded = useCallback((status = 'PENDING_REVIEW') => {
    setListingWizardState((prev) => ({
      ...prev,
      submittedStatus: status,
      step: 'review',
    }));
  }, []);

  return {
    draft,
    categoryProperties,
    step,
    typePhase,
    selectedRootSlug,
    tjkPromptSeen,
    detailsAttempted,
    submittedDraftId,
    submittedStatus,
    paytrMerchantOid,
    paytrIframeUrl,
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
    startPaidCheckout,
    markPaymentSucceeded,
  };
}
