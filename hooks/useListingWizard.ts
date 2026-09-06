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
  isStudServiceListing,
  DEFAULT_LISTING_PACKAGE_CODE,
  loadDraftIntoWizard,
  type IListingRepository,
  type ListingTypePhase,
} from '@/services/listing';
import { tjkRepository, type ITjkRepository } from '@/services/tjk';
import type { AdvertId } from '@/types/advertId';
import type {
  ListingDraft,
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
    existingProps['studHorse'] = horse.registeredName;
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
    existingProps['studDamSire'] = horse.damsire;
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
    draftAdvertId,
    tjkPromptSeen,
    detailsAttempted,
    submittedDraftId,
    submittedStatus,
    paytrMerchantOid,
    paytrIframeUrl,
    paytrAmountMinor,
    mediaSyncStatus,
    mediaSyncError,
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
        paytrAmountMinor: null,
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

      // Aygır ırkını kategoriye göre otomatik belirle
      const slug = (type.categorySlug || '').toLowerCase();
      const defaultBreed =
        slug === 'ingiliz-aygir'
          ? 'İngiliz'
          : slug === 'arap-aygir'
          ? 'Arap'
          : '';
      const autoStudDetails = isStudServiceListing(type)
        ? {
            studBreed: defaultBreed || undefined,
            gender: 'Erkek' as const,
            properties: {
              ...(defaultBreed ? { studBreed: defaultBreed, STALLION_BREED: defaultBreed } : {}),
              HORSE_GENDER: 'Erkek',
              gender: 'Erkek',
            },
          }
        : null;

      const mergeAutoStudDetails = <T extends { studBreed?: string; gender?: any; properties?: Record<string, unknown> }>(base: T): T =>
        autoStudDetails
          ? ({
              ...base,
              ...(autoStudDetails.studBreed ? { studBreed: autoStudDetails.studBreed } : {}),
              gender: 'Erkek',
              properties: {
                ...(base.properties || {}),
                ...autoStudDetails.properties,
              },
            } as T)
          : base;
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
            ? mergeAutoStudDetails({
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
              })
            : mergeAutoStudDetails(prev.draft.details),
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
      setListingWizardState((prev) => ({
        ...prev,
        mediaSyncStatus:
          prev.mediaSyncStatus === 'ready' ? 'ready' : 'uploading',
        mediaSyncError: null,
      }));
      try {
        const created = await listingRepo.publish(draft, accessToken);
        setListingWizardState((prev) => ({
          ...prev,
          draftAdvertId: created.advertId,
          submittedDraftId: created.advertId,
          submittedStatus: created.status,
          step: 'review',
          mediaSyncStatus: 'ready',
          mediaSyncError: null,
          paytrMerchantOid: null,
          paytrIframeUrl: null,
          paytrAmountMinor: null,
          draft: {
            ...prev.draft,
            advertId: created.advertId,
            packageCode: draft.packageCode,
          },
        }));
        return created;
      } catch (err) {
        setListingWizardState((prev) => ({
          ...prev,
          mediaSyncStatus: 'error',
          mediaSyncError:
            err instanceof Error ? err.message : 'Görsel yükleme / gönderim başarısız.',
        }));
        throw err;
      }
    },
    [listingRepo]
  );

  /**
   * Details → package: persist advert shell + properties, start background media.
   * Navigates only after shell succeeds; uploads continue on package step.
   */
  const persistDraftAndStartMedia = useCallback(
    async (accessToken: string) => {
      const current = getListingWizardState();
      const persist =
        listingRepo.persistDraftShell ?? listingRepo.createDraft;
      if (!persist) {
        throw new Error('İlan kaydı yapılandırılmamış.');
      }
      setListingWizardState((prev) => ({
        ...prev,
        mediaSyncStatus: 'uploading',
        mediaSyncError: null,
      }));
      try {
        const shell = await persist(current.draft, accessToken);
        setListingWizardState((prev) => ({
          ...prev,
          draftAdvertId: shell.advertId,
          draft: {
            ...prev.draft,
            advertId: shell.advertId,
            serverVersion: shell.version,
            mediaVersion: shell.mediaVersion,
          },
          mediaSyncStatus: 'uploading',
          mediaSyncError: null,
        }));
        // Resolve media in background; update status when done.
        void (async () => {
          try {
            const media = await listingRepo.awaitMediaPipeline?.(shell.advertId);
            setListingWizardState((prev) => {
              if (prev.draft.advertId !== shell.advertId) return prev;
              return {
                ...prev,
                mediaSyncStatus: 'ready',
                mediaSyncError: null,
                draft: {
                  ...prev.draft,
                  serverVersion: media?.version ?? prev.draft.serverVersion,
                  mediaVersion: media?.mediaVersion ?? prev.draft.mediaVersion,
                },
              };
            });
          } catch (err) {
            setListingWizardState((prev) => {
              if (prev.draft.advertId !== shell.advertId) return prev;
              return {
                ...prev,
                mediaSyncStatus: 'error',
                mediaSyncError:
                  err instanceof Error
                    ? err.message
                    : 'Görseller yüklenemedi.',
              };
            });
          }
        })();
        return shell;
      } catch (err) {
        setListingWizardState((prev) => ({
          ...prev,
          mediaSyncStatus: 'error',
          mediaSyncError:
            err instanceof Error ? err.message : 'İlan kaydedilemedi.',
        }));
        throw err;
      }
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
      if (!listingRepo.startPaytrCheckout) {
        throw new Error('Ödeme servisi yapılandırılmamış.');
      }

      let advertId = current.draft.advertId ?? current.draftAdvertId;
      if (!advertId) {
        const shell = await persistDraftAndStartMedia(accessToken);
        advertId = shell.advertId;
      }

      setListingWizardState((prev) => ({
        ...prev,
        mediaSyncStatus:
          prev.mediaSyncStatus === 'ready' ? 'ready' : 'uploading',
      }));
      await listingRepo.awaitMediaPipeline?.(advertId);
      setListingWizardState((prev) => ({
        ...prev,
        mediaSyncStatus: 'ready',
        mediaSyncError: null,
      }));

      const checkout = await listingRepo.startPaytrCheckout(
        advertId,
        packageCode,
        accessToken
      );
      setListingWizardState((prev) => ({
        ...prev,
        draftAdvertId: advertId,
        submittedDraftId: advertId,
        submittedStatus: 'DRAFT',
        paytrMerchantOid: checkout.merchantOid,
        paytrIframeUrl: checkout.iframeUrl,
        paytrAmountMinor: checkout.amountMinor ?? null,
        step: 'payment',
        draft: { ...prev.draft, advertId },
      }));
      return checkout;
    },
    [listingRepo, publishListing, persistDraftAndStartMedia]
  );

  const markPaymentSucceeded = useCallback((status = 'PENDING_REVIEW') => {
    setListingWizardState((prev) => ({
      ...prev,
      submittedStatus: status,
      step: 'review',
    }));
  }, []);

  const loadDraft = useCallback((loadedDraft: ListingDraft, advertId: AdvertId) => {
    loadDraftIntoWizard(loadedDraft, advertId);
  }, []);

  return {
    draft,
    categoryProperties,
    step,
    typePhase,
    selectedRootSlug,
    draftAdvertId,
    tjkPromptSeen,
    detailsAttempted,
    submittedDraftId,
    submittedStatus,
    paytrMerchantOid,
    paytrIframeUrl,
    paytrAmountMinor,
    mediaSyncStatus,
    mediaSyncError,
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
    persistDraftAndStartMedia,
    publishListing,
    startPaidCheckout,
    markPaymentSucceeded,
    loadDraft,
  };
}
