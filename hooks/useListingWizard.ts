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
  isTjkEligibleListing,
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

function normalizeTjkAge(rawAge: number | string | undefined | null): string {
  if (rawAge == null || rawAge === '') return '';
  const str = String(rawAge).trim();
  if ([
    '0', '1', '1.5', '2', '3', '4', '5', '6', '7', '8', '9', '10-15 arası', '15 üzeri'
  ].includes(str)) return str;
  const num = parseFloat(str.replace(',', '.'));
  if (isNaN(num)) return str;
  if (num === 0) return '0';
  if (num === 1) return '1';
  if (num === 1.5) return '1.5';
  if (num === 2) return '2';
  if (num === 3) return '3';
  if (num === 4) return '4';
  if (num === 5) return '5';
  if (num === 6) return '6';
  if (num === 7) return '7';
  if (num === 8) return '8';
  if (num === 9) return '9';
  if (num >= 10 && num <= 15) return '10-15 arası';
  if (num > 15) return '15 üzeri';
  return String(num);
}

function normalizeTjkGender(rawGender: string | undefined | null): 'Erkek' | 'Dişi' | 'İğdiş' | '' {
  if (!rawGender) return '';
  const g = rawGender.trim().replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
  if (g.startsWith('e')) return 'Erkek';
  if (g.startsWith('d')) return 'Dişi';
  if (g.startsWith('i') || g.startsWith('ı')) return 'İğdiş';
  return '';
}

function normalizeTjkBreed(rawBreed: string | undefined | null): string {
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

  const stallionBreed = normalizedBreed.includes('Arap')
    ? 'Arap'
    : normalizedBreed.includes('İngiliz')
      ? 'İngiliz'
      : normalizedBreed || horse.breed;

  const stallionAge = normalizedAge || (horse.age != null ? String(horse.age) : '');

  // Sync TJK fields directly to canonical property codes
  if (horse.coatColor) {
    existingProps['COAT_COLOR'] = horse.coatColor;
    existingProps['studCoatColor'] = horse.coatColor;
  }
  if (normalizedGender) {
    existingProps['HORSE_GENDER'] = normalizedGender;
  }
  if (normalizedAge) {
    existingProps['HORSE_AGE'] = normalizedAge;
  }
  if (stallionAge) {
    existingProps['STALLION_AGE'] = stallionAge;
    existingProps['studAge'] = stallionAge;
  }
  if (normalizedBreed) {
    existingProps['HORSE_BREED'] = normalizedBreed;
  }
  if (stallionBreed) {
    existingProps['STALLION_BREED'] = stallionBreed;
    existingProps['studBreed'] = stallionBreed;
  }

  // TJK Soy Ağacı ve Kimlik Alanları (Satılık Atlar & Aşım Hizmetleri)
  if (horse.registeredName) {
    existingProps['REGISTERED_NAME'] = horse.registeredName;
    existingProps['HORSE_NAME'] = horse.registeredName;
    existingProps['studHorseName'] = horse.registeredName;
  }
  if (horse.tjkNumber) {
    existingProps['TJK_NUMBER'] = horse.tjkNumber;
  }
  if (horse.sire) {
    existingProps['SIRE'] = horse.sire;
    existingProps['studSire'] = horse.sire;
  }
  if (horse.dam) {
    existingProps['DAM'] = horse.dam;
    existingProps['studDam'] = horse.dam;
  }
  if (horse.damsire) {
    existingProps['DAMSIRE'] = horse.damsire;
    existingProps['studDamsire'] = horse.damsire;
  }
  if (horse.birthDate) {
    existingProps['BIRTH_DATE'] = horse.birthDate;
  }
  if (horse.heightCm != null) {
    existingProps['HEIGHT_CM'] = horse.heightCm;
  }
  if (horse.breeder) {
    existingProps['BREEDER'] = horse.breeder;
  }
  if (horse.trainer) {
    existingProps['TRAINER'] = horse.trainer;
  }
  if (horse.owners && horse.owners.length > 0) {
    existingProps['OWNER'] = horse.owners.join(', ');
  }

  return {
    ...details,
    registeredName: horse.registeredName,
    studHorseName: horse.registeredName,
    gender: (normalizedGender as any) || horse.gender,
    birthDate: horse.birthDate,
    age: normalizedAge || String(horse.age),
    studAge: stallionAge,
    coatColor: horse.coatColor,
    studCoatColor: horse.coatColor,
    breed: normalizedBreed || horse.breed,
    studBreed: stallionBreed,
    heightCm: horse.heightCm != null ? String(horse.heightCm) : '',
    sire: horse.sire,
    studSire: horse.sire,
    dam: horse.dam,
    studDam: horse.dam,
    damsire: horse.damsire,
    studDamsire: horse.damsire,
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
    const isClearing = !root.categorySlug;
    setListingWizardState((prev) => ({
      ...prev,
      typePhase: isClearing ? 'root' : 'category',
      selectedRootSlug: isClearing ? null : root.categorySlug,
      submittedDraftId: null,
      submittedStatus: null,
      draft: { ...prev.draft, type: null, breed: null },
    }));
  }, []);

  const selectType = useCallback((type: ListingTypeSelection) => {
    setListingWizardState((prev) => {
      const isDifferentCategory = prev.draft.type?.categoryId !== type.categoryId;
      const isHorse = isSaleHorseListing(type) || isTjkEligibleListing(type);
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
                ...(isHorse
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
                facilityTrainingTrack: false,
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
          selectedRootSlug: null,
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
        selectedRootSlug:
          prevStep === 'type' && !prev.draft.type
            ? null
            : prev.selectedRootSlug,
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
