import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLayoutWidth } from '@/hooks/useLayoutWidth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { getValidAccessToken } from '@/services/auth';
import {
  listingRepository,
  DEFAULT_EKURI_PACKAGES,
  detailsErrors,
  isHorseListing,
  isPansiyonListing,
  isStudServiceListing,
  isTransportListing,
  type ListingFieldErrors,
  type ListingTypePhase,
  loadEkuriDraft,
  saveEkuriDraft,
  clearEkuriDraft,
  generateEkuriCode,
} from '@/services/listing';
import { HttpClient, resolveApiBaseUrl } from '@/services/http';
import { formatMoney } from '@/utils/formatMoney';
import { copyToClipboard } from '@/utils/copyToClipboard';
import { getActiveBankAccounts, type BankAccount } from '@/services/payment/BankAccountService';
import { isPaytrCheckoutEnabled } from '@/constants/Paytr';
import { useCatalogFacets } from '@/hooks/useCatalogFacets';
import { getCategoryIcon } from '@/services/catalog/categoryDisplay';
import { PostTypeStep } from './PostTypeStep';
import { PostDetailsStep } from './PostDetailsStep';
import { createEmptyDraft } from '@/services/listing/listingDraftStore';
import { buildDraftProperties, mapDraftToCreateAdvert } from '@/services/listing/mapDraftToRequest';
import { parseInternationalPhone } from '@/services/phone';
import { catalogRepository } from '@/services/catalog';
import {
  getGlobalPropertiesConfig,
  setGlobalPropertiesConfig,
  type GlobalPropertiesMap,
} from '@/services/catalog/addressConfig';
import { tjkRepository } from '@/services/tjk';
import { mediaUploader } from '@/services/media/createMediaUploader';
import { locationLookup } from '@/services/location';
import { applyTjkProfile } from '@/hooks/useListingWizard';
import type { CategoryPropertyPublic } from '@/types';
import type {
  ListingDraft,
  ListingMediaSlot,
  ListingPackage,
  ListingTypeSelection,
} from '@/types/listing';
import type { PublicCampaign, CouponValidationResult } from '@/types/coupon';

export interface EkuriListingItem {
  id: string;
  draft: ListingDraft;
  isCompleted: boolean;
  tjkPromptSeen?: boolean;
}

function createEmptyEkuriItem(index: number): EkuriListingItem {
  return {
    id: `ekuri-item-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    draft: createEmptyDraft(),
    isCompleted: false,
    tjkPromptSeen: false,
  };
}

function formatIban(iban: string): string {
  const clean = (iban || '').replace(/\s+/g, '').toUpperCase();
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

const EKURI_STEPPER_ITEMS = [
  { key: 'listings', label: 'İlanlar' },
  { key: 'package', label: 'Paket' },
  { key: 'checkout', label: 'Ödeme' },
  { key: 'success', label: 'Gönder' },
] as const;

export function PostEkuriWizardView({
  onSwitchToSingle,
  onClose,
}: {
  onSwitchToSingle?: () => void;
  onClose?: () => void;
}) {
  const { isDark } = useAppTheme();
  const router = useRouter();
  const width = useLayoutWidth();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const { session, isLoggedIn } = useAuthSession();

  const handleExit = useCallback(() => {
    if (onClose) {
      onClose();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [onClose, router]);

  const contentMax = 720;
  const initialDraft = useMemo(() => loadEkuriDraft(), []);

  // Wizard state: 1: listings, 2: package, 3: checkout, 4: success
  const [step, setStep] = useState<'listings' | 'package' | 'checkout' | 'success'>(
    () => initialDraft?.step || 'listings'
  );
  const [items, setItems] = useState<EkuriListingItem[]>(
    () => (initialDraft?.items && initialDraft.items.length >= 2 ? initialDraft.items : [
      createEmptyEkuriItem(1),
      createEmptyEkuriItem(2),
    ])
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Catalog facets for category tree
  const { categoryTree, error: catalogError, loading: catalogLoading } = useCatalogFacets();

  // Category properties configuration cached per category slug/id
  const [categoryPropertiesCache, setCategoryPropertiesCache] = useState<Record<string, CategoryPropertyPublic[]>>({});
  const [globalConfigs, setGlobalConfigs] = useState<GlobalPropertiesMap>(getGlobalPropertiesConfig());
  const [customGlobalProperties, setCustomGlobalProperties] = useState<CategoryPropertyPublic[]>([]);

  // Pre-fetch category definitions for all items that have a category
  useEffect(() => {
    for (const it of items) {
      const catId = it.draft.type?.categoryId || it.draft.type?.categorySlug;
      const catSlug = it.draft.type?.categorySlug;
      const key = catSlug || catId;
      if (key && !categoryPropertiesCache[key]) {
        void catalogRepository
          .getCategoryFormDefinition(catId || key, { categorySlug: catSlug } as any)
          .then((def) => {
            if (def && Array.isArray(def.properties)) {
              setCategoryPropertiesCache((prev) => {
                if (prev[key]) return prev;
                return {
                  ...prev,
                  [key]: def.properties.map((p) => ({
                    ...p,
                    categoryId: (p as any).categoryId || def.categoryId || catId,
                  })),
                };
              });
            }
          })
          .catch(() => {});
      }
    }
  }, [items, categoryPropertiesCache]);

  // Packages state
  const [packages, setPackages] = useState<ListingPackage[]>(() => DEFAULT_EKURI_PACKAGES);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedPackageCode, setSelectedPackageCode] = useState<string | null>(null);

  // Campaigns & Coupons state
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(
    () => (initialDraft as any)?.appliedCoupon || null
  );
  const [activeCampaigns, setActiveCampaigns] = useState<PublicCampaign[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const camps = await (listingRepository.getActiveCampaigns
          ? listingRepository.getActiveCampaigns()
          : Promise.resolve([]));
        if (active) {
          setActiveCampaigns(camps);
        }
      } catch {
        // Non-critical background fetch failure
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const extractCampaignDiscount = (
    campaign: PublicCampaign,
    originalMinor: number
  ): { discountMinor: number; campaignPriceMinor: number } | null => {
    if (
      campaign.displayCampaignPriceAmountMinor != null &&
      campaign.displayCampaignPriceAmountMinor < originalMinor
    ) {
      return {
        discountMinor: originalMinor - campaign.displayCampaignPriceAmountMinor,
        campaignPriceMinor: campaign.displayCampaignPriceAmountMinor,
      };
    }

    const textStr = `${campaign.badgeText || ''} ${campaign.title || ''} ${campaign.name || ''}`;

    const percentMatch = textStr.match(/%\s*(\d+(?:[.,]\d+)?)/) || textStr.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (percentMatch) {
      const pct = parseFloat(percentMatch[1].replace(',', '.'));
      if (!isNaN(pct) && pct > 0 && pct <= 100) {
        const discountMinor = Math.round(originalMinor * (pct / 100));
        return {
          discountMinor,
          campaignPriceMinor: Math.max(0, originalMinor - discountMinor),
        };
      }
    }

    const fixedMatch =
      textStr.match(/[₺TL]\s*(\d+(?:[.,]\d+)?)/i) ||
      textStr.match(/(\d+(?:[.,]\d+)?)\s*(?:₺|TL)/i);
    if (fixedMatch) {
      const amountTL = parseFloat(fixedMatch[1].replace(',', '.'));
      if (!isNaN(amountTL) && amountTL > 0) {
        const discountMinor = Math.min(originalMinor, Math.round(amountTL * 100));
        return {
          discountMinor,
          campaignPriceMinor: Math.max(0, originalMinor - discountMinor),
        };
      }
    }

    return null;
  };

  const getPackageCampaignDiscount = (pkg: ListingPackage) => {
    const specificCampaign = activeCampaigns.find(
      (c) =>
        c.targetPackageCode &&
        c.targetPackageCode.trim() !== '' &&
        c.targetPackageCode.toUpperCase() !== 'ALL' &&
        c.targetPackageCode.toUpperCase() === pkg.code.toUpperCase()
    );

    if (specificCampaign) {
      const discount = extractCampaignDiscount(specificCampaign, pkg.price.amountMinor);
      if (discount && discount.discountMinor > 0) {
        return {
          campaign: specificCampaign,
          ...discount,
        };
      }
    }

    const globalCampaign = activeCampaigns.find(
      (c) =>
        !c.targetPackageCode ||
        c.targetPackageCode.trim() === '' ||
        c.targetPackageCode.toUpperCase() === 'ALL'
    );

    if (globalCampaign) {
      const discount = extractCampaignDiscount(globalCampaign, pkg.price.amountMinor);
      if (discount && discount.discountMinor > 0) {
        return {
          campaign: globalCampaign,
          ...discount,
        };
      }
    }

    return null;
  };

  const getNormalizedCoupon = (ac?: CouponValidationResult | null) => {
    if (!ac?.valid || !ac.coupon) return null;
    const raw = ac.coupon as any;
    const code: string = raw.code || raw.Code || '';
    const name: string = raw.name || raw.Name || code || 'Kupon';
    const rawType = String(raw.discountType || raw.DiscountType || '').toUpperCase();
    const isPercentage = rawType.includes('PERCENT');
    const rawVal = Number(raw.discountValue ?? raw.DiscountValue ?? 0);
    const applicablePackageCode: string | null =
      raw.applicablePackageCode || raw.ApplicablePackageCode || null;

    const backendDiscountMinor =
      typeof ac.discountAmountMinor === 'number' && !isNaN(ac.discountAmountMinor)
        ? ac.discountAmountMinor
        : null;

    return {
      code,
      name,
      isPercentage,
      discountValue: rawVal,
      applicablePackageCode,
      backendDiscountMinor,
    };
  };

  const getPackageCouponDiscount = (pkg: ListingPackage, baseAmountMinor: number) => {
    const coupon = getNormalizedCoupon(appliedCoupon);
    if (!coupon) return null;

    const targetPkg = coupon.applicablePackageCode;
    if (
      targetPkg &&
      targetPkg.trim() !== '' &&
      targetPkg.toUpperCase() !== 'ALL' &&
      targetPkg.toUpperCase() !== pkg.code.toUpperCase()
    ) {
      return null;
    }

    if (coupon.isPercentage && coupon.discountValue > 0) {
      const discountMinor = Math.round(baseAmountMinor * (coupon.discountValue / 100));
      return {
        coupon,
        discountMinor: Math.min(baseAmountMinor, isNaN(discountMinor) ? 0 : discountMinor),
      };
    }

    const fixedMinor =
      coupon.backendDiscountMinor && coupon.backendDiscountMinor > 0
        ? coupon.backendDiscountMinor
        : coupon.discountValue > 500
        ? coupon.discountValue
        : coupon.discountValue * 100;

    const discountMinor = Math.min(baseAmountMinor, isNaN(fixedMinor) ? 0 : fixedMinor);
    return {
      coupon,
      discountMinor,
    };
  };

  const getPackageDiscountedAmount = (pkg: ListingPackage) => {
    const campaignInfo = getPackageCampaignDiscount(pkg);
    const baseMinor = campaignInfo ? campaignInfo.campaignPriceMinor : pkg.price.amountMinor;
    const couponInfo = getPackageCouponDiscount(pkg, baseMinor);

    if (!campaignInfo && !couponInfo) {
      return null;
    }

    const finalMinor = couponInfo ? Math.max(0, baseMinor - couponInfo.discountMinor) : baseMinor;
    return isNaN(finalMinor) ? pkg.price.amountMinor : finalMinor;
  };

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply ?? couponInput).trim();
    if (!code) {
      setCouponError('Lütfen bir kupon kodu giriniz.');
      return;
    }

    setCouponLoading(true);
    setCouponError(null);
    try {
      if (!listingRepository.validateCoupon) {
        throw new Error('Kupon doğrulama servisi bulunamadı.');
      }
      const targetPkg = selectedPackage || packages[0];
      const spendAmountMinor = targetPkg?.price?.amountMinor ?? 0;
      const token = await getValidAccessToken();
      const res = await listingRepository.validateCoupon(
        code,
        spendAmountMinor,
        selectedPackageCode || undefined,
        token || undefined
      );
      if (!res.valid) {
        setCouponError(res.message || 'Geçersiz veya süresi dolmuş kupon kodu.');
      } else {
        setAppliedCoupon(res);
        setCouponInput('');
      }
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Kupon uygulanamadı.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Checkout state
  const paytrEnabled = isPaytrCheckoutEnabled();
  const [paymentMethod, setPaymentMethod] = useState<'CC' | 'TRANSFER'>(
    () => initialDraft?.paymentMethod || 'TRANSFER'
  );
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [copiedIban, setCopiedIban] = useState<string | null>(null);
  const [bundleCopied, setBundleCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdBundleId, setCreatedBundleId] = useState<string | null>(
    () => initialDraft?.createdBundleId || null
  );
  const [ekuriCode, setEkuriCode] = useState<string>(
    () => initialDraft?.ekuriCode || generateEkuriCode()
  );
  const [copiedCode, setCopiedCode] = useState(false);

  // Modal / Popup State for listing configuration
  const [modalVisible, setModalVisible] = useState(
    () => Boolean(initialDraft?.modalVisible && initialDraft?.editingIndex !== null && initialDraft?.editingIndex !== undefined)
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(
    () => (initialDraft?.editingIndex !== undefined ? initialDraft.editingIndex : null)
  );
  const [editingDraft, setEditingDraft] = useState<ListingDraft | null>(
    () => {
      if (initialDraft?.editingDraft) return initialDraft.editingDraft;
      if (initialDraft?.editingIndex !== null && initialDraft?.editingIndex !== undefined && initialDraft?.items?.[initialDraft.editingIndex]) {
        return initialDraft.items[initialDraft.editingIndex].draft;
      }
      return null;
    }
  );
  const [modalStep, setModalStep] = useState<'category' | 'details'>(
    () => initialDraft?.modalStep || 'category'
  );
  const [categoryPhase, setCategoryPhase] = useState<ListingTypePhase>(
    () => initialDraft?.categoryPhase || 'root'
  );
  const [selectedRootSlug, setSelectedRootSlug] = useState<string | null>(
    () => initialDraft?.selectedRootSlug || null
  );
  const [modalFieldErrors, setModalFieldErrors] = useState<ListingFieldErrors>({});
  const [modalErrorBanner, setModalErrorBanner] = useState<string | null>(null);
  const [modalScrollTrigger, setModalScrollTrigger] = useState(0);
  const modalScrollRef = useRef<ScrollView>(null);
  const localFileMapRef = useRef<Map<string, File>>(new Map());
  const [modalTjkPromptSeen, setModalTjkPromptSeen] = useState(
    () => initialDraft?.modalTjkPromptSeen || false
  );
  const [resetConfirmVisible, setResetConfirmVisible] = useState(false);

  // Synchronous ref for instant flush on page unload
  const stateRef = useRef({
    step,
    items,
    selectedPackageCode,
    paymentMethod,
    ekuriCode,
    createdBundleId,
    modalVisible,
    editingIndex,
    editingDraft,
    modalStep,
    categoryPhase,
    selectedRootSlug,
    modalTjkPromptSeen,
    appliedCoupon,
  });

  stateRef.current = {
    step,
    items,
    selectedPackageCode,
    paymentMethod,
    ekuriCode,
    createdBundleId,
    modalVisible,
    editingIndex,
    editingDraft,
    modalStep,
    categoryPhase,
    selectedRootSlug,
    modalTjkPromptSeen,
    appliedCoupon,
  };

  // Auto-save draft on every state update
  useEffect(() => {
    if (step === 'success') {
      clearEkuriDraft();
      return;
    }

    let itemsToSave = items;
    if (modalVisible && editingIndex !== null && editingDraft && items[editingIndex]) {
      itemsToSave = items.map((it, idx) =>
        idx === editingIndex ? { ...it, draft: editingDraft } : it
      );
    }

    const hasContent =
      itemsToSave.some(
        (it) =>
          it.draft.type ||
          it.draft.details.title?.trim() ||
          it.draft.details.priceTl?.trim() ||
          it.draft.media?.length > 0 ||
          it.isCompleted
      ) ||
      step !== 'listings' ||
      selectedPackageCode !== null ||
      appliedCoupon !== null;

    if (!hasContent) {
      clearEkuriDraft();
      return;
    }

    saveEkuriDraft({
      step,
      items: itemsToSave,
      selectedPackageCode,
      paymentMethod,
      ekuriCode,
      createdBundleId,
      modalVisible,
      editingIndex,
      editingDraft,
      modalStep,
      categoryPhase,
      selectedRootSlug,
      modalTjkPromptSeen,
      appliedCoupon,
      updatedAt: Date.now(),
    });
  }, [
    step,
    items,
    selectedPackageCode,
    paymentMethod,
    ekuriCode,
    createdBundleId,
    modalVisible,
    editingIndex,
    editingDraft,
    modalStep,
    categoryPhase,
    selectedRootSlug,
    modalTjkPromptSeen,
    appliedCoupon,
  ]);

  // Flush pending changes before page unloads or refreshes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const flush = () => {
      const cur = stateRef.current;
      if (cur.step === 'success') {
        clearEkuriDraft();
        return;
      }

      let itemsToSave = cur.items;
      if (cur.modalVisible && cur.editingIndex !== null && cur.editingDraft && cur.items[cur.editingIndex]) {
        itemsToSave = cur.items.map((it, idx) =>
          idx === cur.editingIndex ? { ...it, draft: cur.editingDraft! } : it
        );
      }

      const hasContent =
        itemsToSave.some(
          (it) =>
            it.draft.type ||
            it.draft.details.title?.trim() ||
            it.draft.details.priceTl?.trim() ||
            it.draft.media?.length > 0 ||
            it.isCompleted
        ) ||
        cur.step !== 'listings' ||
        cur.selectedPackageCode !== null ||
        cur.appliedCoupon !== null;

      if (!hasContent) {
        clearEkuriDraft();
        return;
      }

      saveEkuriDraft({
        step: cur.step,
        items: itemsToSave,
        selectedPackageCode: cur.selectedPackageCode,
        paymentMethod: cur.paymentMethod,
        ekuriCode: cur.ekuriCode,
        createdBundleId: cur.createdBundleId,
        modalVisible: cur.modalVisible,
        editingIndex: cur.editingIndex,
        editingDraft: cur.editingDraft,
        modalStep: cur.modalStep,
        categoryPhase: cur.categoryPhase,
        selectedRootSlug: cur.selectedRootSlug,
        modalTjkPromptSeen: cur.modalTjkPromptSeen,
        appliedCoupon: cur.appliedCoupon,
        updatedAt: Date.now(),
      });
    };

    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);

    return () => {
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  const hasAnyDraftContent = useMemo(() => {
    return items.some(
      (it) =>
        it.draft.type ||
        it.draft.details.title?.trim() ||
        it.draft.details.priceTl?.trim() ||
        it.draft.media.length > 0 ||
        it.isCompleted
    );
  }, [items]);

  const executeReset = useCallback(() => {
    clearEkuriDraft();
    localFileMapRef.current.clear();
    setItems([createEmptyEkuriItem(1), createEmptyEkuriItem(2)]);
    setSelectedPackageCode(null);
    setCreatedBundleId(null);
    setEkuriCode(generateEkuriCode());
    setStep('listings');
    setSubmitError(null);
    setValidationErrors({});
    setModalVisible(false);
    setEditingDraft(null);
    setEditingIndex(null);
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
    setResetConfirmVisible(false);
  }, []);

  const handleResetDraft = () => {
    setResetConfirmVisible(true);
  };

  const handleSwitchToSingle = useCallback(() => {
    if (modalVisible) {
      setModalVisible(false);
    }
    if (onSwitchToSingle) {
      onSwitchToSingle();
    } else if (Platform.OS === 'web') {
      router.replace('/post?mode=single');
    } else {
      router.setParams({ mode: 'single' });
    }
  }, [modalVisible, onSwitchToSingle, router]);

  // Theme colors
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const primary = useThemeColor('primary');
  const success = useThemeColor('success');
  const cardBg = useThemeColor('surface');
  const bg = useThemeColor('background');

  // Load bank accounts on demand when on checkout with TRANSFER
  useEffect(() => {
    if (step === 'checkout' && paymentMethod === 'TRANSFER') {
      setLoadingBanks(true);
      getActiveBankAccounts()
        .then((accs) => setBankAccounts(accs || []))
        .catch(() => {})
        .finally(() => setLoadingBanks(false));
    }
  }, [step, paymentMethod]);

  // Load global properties config (ortak-alanlar)
  useEffect(() => {
    let cancelled = false;
    const refresh = () => setGlobalConfigs(getGlobalPropertiesConfig());

    void catalogRepository
      .getCategoryFormDefinition('ortak-alanlar', {
        categorySlug: 'ortak-alanlar',
        localOnly: true,
      })
      .then((def) => {
        if (!cancelled && def && Array.isArray(def.properties)) {
          const map = getGlobalPropertiesConfig();
          const returnedCodes = new Set(def.properties.map((p) => String(p.code || '').toUpperCase()));

          const CANONICAL_CODES = new Set([
            'ADDRESS',
            'DESCRIPTION',
            'PRICE',
            'LOCATION',
            'PHONE',
            'TITLE',
            'MEDIA',
            'IMAGES',
          ]);
          const customProps = def.properties.filter(
            (p) =>
              !CANONICAL_CODES.has(String(p.code || '').toUpperCase()) &&
              (p as any).isActive !== false &&
              (p as any).is_active !== false &&
              (p as any).isFormVisible !== false &&
              (p as any).is_form_visible !== false
          );
          setCustomGlobalProperties(customProps);

          for (const p of def.properties) {
            const code = String(p.code || '').toUpperCase();
            if (code) {
              const isFormVis = Boolean((p as any).isFormVisible !== false && (p as any).is_form_visible !== false);
              const isAct = Boolean((p as any).isActive !== false && (p as any).is_active !== false && isFormVis);
              map[code] = {
                code,
                title: p.title || code,
                isActive: isAct,
                isRequired: Boolean(p.isRequired || (p as any).is_required),
                isFormVisible: isFormVis,
                isPublicVisible: Boolean((p as any).isPublicVisible !== false && (p as any).is_public_visible !== false),
              };
            }
          }

          for (const code of ['ADDRESS', 'DESCRIPTION', 'PRICE', 'LOCATION', 'PHONE']) {
            if (!returnedCodes.has(code) && map[code]) {
              map[code] = {
                ...map[code],
                isActive: false,
                isFormVisible: false,
              };
            }
          }

          setGlobalPropertiesConfig(map);
          setGlobalConfigs({ ...map });
        }
      })
      .catch(() => {});

    if (typeof window !== 'undefined') {
      window.addEventListener('haradan_global_properties_changed', refresh);
      return () => {
        cancelled = true;
        window.removeEventListener('haradan_global_properties_changed', refresh);
      };
    }
  }, []);

  // Load Eküri packages (no pre-selected package)
  useEffect(() => {
    let cancelled = false;
    if (packages.length === 0) {
      setPackagesLoading(true);
    }
    void listingRepository
      .getPackages()
      .then((pkgs) => {
        if (cancelled) return;
        const ekuriOnly = (pkgs ?? []).filter((p) => p.packageType === 'EKURI');
        if (ekuriOnly.length > 0) {
          setPackages(ekuriOnly);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPackagesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Invalidate selectedPackageCode if item count exceeds package capacity
  useEffect(() => {
    if (selectedPackageCode && packages.length > 0) {
      const pkg = packages.find((p) => p.code === selectedPackageCode);
      if (!pkg || (pkg.horseLimit ?? 0) < items.length) {
        setSelectedPackageCode(null);
      }
    }
  }, [items.length, packages, selectedPackageCode]);

  // Open modal for a specific listing
  const openModalFor = useCallback(
    (it: EkuriListingItem, index: number) => {
      setEditingIndex(index);
      const clonedDraft: ListingDraft = JSON.parse(JSON.stringify(it.draft));
      clonedDraft.media = (it.draft.media || []).map((slot) => {
        const candidate = (slot as any).file;
        const actualFile = typeof Blob !== 'undefined' && candidate instanceof Blob
          ? (candidate as File)
          : localFileMapRef.current.get(slot.localId);
        return {
          ...slot,
          file: actualFile,
        };
      });

      // Auto-fill seller phone from session if empty
      if (session?.user?.phone && !clonedDraft.details.sellerPhone) {
        const parsed = parseInternationalPhone(session.user.phone);
        clonedDraft.details.phoneCountryIso = parsed.iso;
        clonedDraft.details.sellerPhone = parsed.national;
      }

      setEditingDraft(clonedDraft);
      setModalTjkPromptSeen(it.tjkPromptSeen ?? false);

      if (clonedDraft.type && clonedDraft.type.categoryName) {
        setModalStep('details');
      } else {
        setModalStep('category');
        setCategoryPhase('root');
        setSelectedRootSlug(null);
      }
      setModalFieldErrors({});
      setModalErrorBanner(null);
      setModalVisible(true);
    },
    [session?.user?.phone]
  );

  const openModal = (index: number) => {
    const it = items[index];
    if (!it) return;
    openModalFor(it, index);
  };

  // Add listing
  const addItem = () => {
    if (items.length >= 10) {
      Alert.alert('Sınır Ulaşıldı', 'Bir eküri ilanında en fazla 10 ilan ekleyebilirsiniz.');
      return;
    }
    const nextIndex = items.length;
    const newItem = createEmptyEkuriItem(nextIndex + 1);
    setItems((prev) => [...prev, newItem]);
    openModalFor(newItem, nextIndex);
  };

  // Remove listing
  const removeItem = (id: string) => {
    if (items.length <= 2) {
      Alert.alert('Uyarı', 'Eküri ilanı oluşturabilmek için en az 2 ilan eklemelisiniz.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Modal handlers
  const handleCloseModal = () => {
    if (editingDraft && editingIndex !== null) {
      const hasAnyInput = Boolean(
        editingDraft.type ||
        editingDraft.details.title ||
        editingDraft.details.priceTl ||
        editingDraft.media.length > 0
      );

      if (hasAnyInput) {
        setItems((prev) => {
          const next = [...prev];
          if (next[editingIndex]) {
            const preservedMedia = (editingDraft.media || []).map((slot) => {
              const candidate = (slot as any).file;
              const actualFile = typeof Blob !== 'undefined' && candidate instanceof Blob
                ? (candidate as File)
                : localFileMapRef.current.get(slot.localId);
              return {
                ...slot,
                file: actualFile,
              };
            });
            next[editingIndex] = {
              ...next[editingIndex],
              draft: {
                ...editingDraft,
                media: preservedMedia,
              },
            };
          }
          return next;
        });
      }
    }

    setModalVisible(false);
    setEditingDraft(null);
    setEditingIndex(null);
    setModalFieldErrors({});
    setModalErrorBanner(null);
  };

  const handleCompleteItem = () => {
    if (!editingDraft || editingIndex === null) return;

    if (!editingDraft.type) {
      setModalErrorBanner('Lütfen önce bir ilan kategorisi seçiniz.');
      return;
    }

    const catKey = editingDraft.type?.categorySlug || editingDraft.type?.categoryId;
    const activeCategoryProperties = catKey ? categoryPropertiesCache[catKey] : undefined;
    const rawErrs = detailsErrors(
      editingDraft,
      activeCategoryProperties,
      globalConfigs,
      customGlobalProperties
    );

    if (Object.keys(rawErrs).length > 0) {
      setModalFieldErrors(rawErrs);
      const firstErr = Object.values(rawErrs)[0];
      setModalErrorBanner(`Lütfen zorunlu alanları doldurunuz: ${firstErr}`);
      setModalScrollTrigger((v) => v + 1);
      modalScrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    const preservedMedia = (editingDraft.media || []).map((slot) => {
      const candidate = (slot as any).file;
      const actualFile = typeof Blob !== 'undefined' && candidate instanceof Blob
        ? (candidate as File)
        : localFileMapRef.current.get(slot.localId);
      if (actualFile) {
        localFileMapRef.current.set(slot.localId, actualFile);
      }
      return {
        ...slot,
        file: actualFile,
      };
    });

    // All valid! Save to items array as completed
    setItems((prev) => {
      const next = [...prev];
      if (next[editingIndex]) {
        next[editingIndex] = {
          ...next[editingIndex],
          draft: {
            ...editingDraft,
            media: preservedMedia,
          },
          isCompleted: true,
          tjkPromptSeen: modalTjkPromptSeen,
        };
      }
      return next;
    });

    // Clear validation error on main screen if previously set
    setValidationErrors((prev) => {
      const copy = { ...prev };
      if (editingDraft) {
        const itemId = items[editingIndex]?.id;
        if (itemId) delete copy[itemId];
      }
      return copy;
    });

    setModalVisible(false);
    setEditingDraft(null);
    setEditingIndex(null);
    setModalFieldErrors({});
    setModalErrorBanner(null);
  };

  // PostDetailsStep callbacks
  const handleUpdateDetails = useCallback((partial: Partial<ListingDraft['details']>) => {
    setEditingDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        details: {
          ...prev.details,
          ...partial,
        },
      };
    });
  }, []);

  const handleMediaChange = useCallback((media: ListingMediaSlot[]) => {
    for (const slot of media) {
      const candidate = (slot as any).file;
      if (typeof Blob !== 'undefined' && candidate instanceof Blob) {
        localFileMapRef.current.set(slot.localId, candidate as File);
      }
    }
    setEditingDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        media,
      };
    });
  }, []);

  const handleSetCover = useCallback((localId: string) => {
    setEditingDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        media: prev.media.map((m) => ({
          ...m,
          isCover: m.localId === localId,
        })),
      };
    });
  }, []);

  const handleApplyTjk = useCallback(async (horseId: string) => {
    try {
      const horse = await tjkRepository.getById(horseId);
      if (!horse) return;
      setEditingDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          details: applyTjkProfile(prev.details, horse, prev.type),
        };
      });
      setModalTjkPromptSeen(true);
    } catch (err) {
      console.warn('Failed to apply TJK profile in ekuri modal:', err);
    }
  }, []);

  const handleSkipTjk = useCallback(() => {
    setModalTjkPromptSeen(true);
    setEditingDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        details: {
          ...prev.details,
          tjkSkipped: true,
        },
      };
    });
  }, []);

  const handleMarkTjkSeen = useCallback(() => {
    setModalTjkPromptSeen(true);
  }, []);

  const handleCategoryPropertiesLoaded = useCallback(
    (props: CategoryPropertyPublic[]) => {
      const catKey = editingDraft?.type?.categorySlug || editingDraft?.type?.categoryId;
      if (catKey && Array.isArray(props)) {
        setCategoryPropertiesCache((prev) => ({
          ...prev,
          [catKey]: props,
        }));
      }
    },
    [editingDraft?.type?.categorySlug, editingDraft?.type?.categoryId]
  );

  // Validate all listings before proceeding to packages
  const validateAllListings = (): boolean => {
    const errs: Record<string, string> = {};
    if (items.length < 2) {
      setSubmitError('Eküri ilanı için en az 2 ilan eklemelisiniz.');
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.draft.type) {
        errs[it.id] = `${i + 1}. İlan için kategori seçilmemiş.`;
      } else {
        const catKey = it.draft.type.categorySlug || it.draft.type.categoryId;
        const itemCategoryProperties = catKey ? categoryPropertiesCache[catKey] : undefined;
        const itemErrs = detailsErrors(
          it.draft,
          itemCategoryProperties,
          globalConfigs,
          customGlobalProperties
        );
        if (Object.keys(itemErrs).length > 0) {
          errs[it.id] = `${i + 1}. İlan eksik: ${Object.values(itemErrs)[0]}`;
        }
      }
    }

    setValidationErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstId = Object.keys(errs)[0];
      const firstIndex = items.findIndex((it) => it.id === firstId);
      setSubmitError(Object.values(errs)[0]);
      if (firstIndex !== -1) {
        openModal(firstIndex);
      }
      return false;
    }
    setSubmitError(null);
    return true;
  };

  const proceedToPackages = () => {
    if (!validateAllListings()) return;
    if (!isSelectedPackageValid) {
      setSelectedPackageCode(null);
    }
    setStep('package');
  };

  const isSelectedPackageValid = useMemo(() => {
    if (!selectedPackageCode) return false;
    const pkg = packages.find((p) => p.code === selectedPackageCode);
    return Boolean(pkg && (pkg.horseLimit ?? 0) >= items.length);
  }, [packages, selectedPackageCode, items.length]);

  const proceedToCheckout = () => {
    if (!selectedPackageCode || !isSelectedPackageValid) {
      setSubmitError('Lütfen ilan sayınıza uygun kapasitede bir eküri paketi seçin.');
      return;
    }
    setSubmitError(null);
    setStep('checkout');
  };

  const activeIndex = step === 'listings' ? 0 : step === 'package' ? 1 : step === 'checkout' ? 2 : 3;

  const handlePressStep = (stepKey: 'listings' | 'package' | 'checkout' | 'success') => {
    if (step === 'success') return;
    if (stepKey === 'listings') {
      setStep('listings');
    } else if (stepKey === 'package') {
      proceedToPackages();
    } else if (stepKey === 'checkout') {
      if (isSelectedPackageValid) {
        proceedToCheckout();
      }
    }
  };

  const selectedPackage = useMemo(() => {
    return packages.find((p) => p.code === selectedPackageCode) ?? null;
  }, [packages, selectedPackageCode]);

  const selectedPackageCampaign = useMemo(() => {
    return selectedPackage ? getPackageCampaignDiscount(selectedPackage) : null;
  }, [selectedPackage, activeCampaigns]);
  const campaignDiscountMinor = selectedPackageCampaign ? selectedPackageCampaign.discountMinor : 0;
  const campaignName = selectedPackageCampaign?.campaign?.name || null;

  const baseMinor = selectedPackageCampaign
    ? selectedPackageCampaign.campaignPriceMinor
    : (selectedPackage?.price?.amountMinor ?? 0);
  const selectedPackageCoupon = useMemo(() => {
    return selectedPackage ? getPackageCouponDiscount(selectedPackage, baseMinor) : null;
  }, [selectedPackage, baseMinor, appliedCoupon]);
  const couponDiscountMinor = selectedPackageCoupon ? selectedPackageCoupon.discountMinor : 0;
  const couponCode = selectedPackageCoupon?.coupon?.code || null;

  const originalPriceMinor = selectedPackage?.price?.amountMinor ?? 0;
  const finalPriceMinor = Math.max(0, originalPriceMinor - campaignDiscountMinor - couponDiscountMinor);
  const isFreeWithCoupon = selectedPackage != null && finalPriceMinor === 0;

  // Submit all listings in bundle
  const handleFinalSubmit = async () => {
    if (!isLoggedIn) {
      router.push('/auth/login?next=/post?mode=ekuri');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    try {
      const token = await getValidAccessToken();
      if (!token) {
        router.push('/auth/login?next=/post?mode=ekuri');
        return;
      }

      const baseUrl = resolveApiBaseUrl() || 'http://localhost:8080/api';
      const http = new HttpClient(baseUrl);

      // Generate shared Eküri bundle ID
      const bundleId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === 'x' ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            });

      // Create adverts for each listing in the bundle
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it.draft.type) {
          throw new Error(`${i + 1}. İlan için kategori seçilmemiş.`);
        }

        // Resolve province and district UUIDs
        let districtId = it.draft.details.districtId || null;
        let provId = it.draft.details.provinceId;
        if (provId) {
          const resolvedProv = locationLookup.resolveProvinceUuid?.(provId);
          if (resolvedProv) {
            provId = resolvedProv;
            it.draft.details.provinceId = resolvedProv;
          }
        }
        if (districtId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(districtId)) {
          if (provId) {
            try {
              const dists = await locationLookup.listDistricts(provId);
              const legacyName = locationLookup.getDistrictName(districtId);
              const matched = dists.find(
                (d) =>
                  d.name.toLowerCase() === legacyName.toLowerCase() ||
                  (legacyName.toLowerCase().includes('merkez') && d.name.toLowerCase().includes('merkez'))
              );
              if (matched) {
                districtId = matched.id;
                it.draft.details.districtId = matched.id;
              }
            } catch {}
          }
        }

        const createBody = mapDraftToCreateAdvert(it.draft);
        createBody.ekuriBundleId = bundleId;
        if (districtId) {
          createBody.districtId = districtId;
        }
        if (!createBody.description) {
          createBody.description = `${createBody.title || `${i + 1}. İlan`} - Haradan Eküri Satışı`;
        }

        const createRes = await http.request<{ id: number; version: number; mediaVersion?: number }>('/v1/me/adverts', {
          method: 'POST',
          accessToken: token,
          body: JSON.stringify(createBody),
        });

        if (!createRes?.id) continue;
        const advertId = createRes.id;
        let currentVersion = createRes.version;
        let mediaVersion = createRes.mediaVersion ?? 1;

        // Set dynamic properties via buildDraftProperties
        const props = buildDraftProperties(it.draft);
        props.ekuriCode = ekuriCode;
        if (couponCode) {
          props.couponCode = couponCode;
        }
        if (campaignName) {
          props.campaignName = campaignName;
        }
        if (Object.keys(props).length > 0) {
          try {
            const propRes = await http.request<{ id: number; version: number }>(`/v1/me/adverts/${advertId}/properties`, {
              method: 'PUT',
              accessToken: token,
              body: JSON.stringify({
                expectedVersion: currentVersion,
                properties: props,
              }),
            });
            if (propRes?.version) {
              currentVersion = propRes.version;
            }
          } catch (e) {
            console.warn('Failed to save advert properties:', e);
          }
        }

        // Upload and attach media if present
        if (Array.isArray(it.draft.media) && it.draft.media.length > 0) {
          try {
            const uploadedSlots = await Promise.all(
              it.draft.media.map(async (slot) => {
                if (slot.assetId) return slot;
                const candidate = (slot as any).file;
                const fileObj = typeof Blob !== 'undefined' && candidate instanceof Blob
                  ? (candidate as File)
                  : localFileMapRef.current.get(slot.localId);
                const res = await mediaUploader.upload(
                  {
                    uri: slot.uri,
                    mimeType: slot.mimeType,
                    fileName: slot.fileName,
                    file: fileObj,
                  },
                  token
                );
                if (!res?.assetId) {
                  throw new Error(
                    `"${it.draft.details.title || `${i + 1}. İlan`}" görseli yüklenemedi.`
                  );
                }
                return { ...slot, assetId: res.assetId };
              })
            );

            const ordered = [
              ...uploadedSlots.filter((m) => m.isCover),
              ...uploadedSlots.filter((m) => !m.isCover),
            ];
            const coverSlot = uploadedSlots.find((m) => m.isCover) ?? uploadedSlots[0];

            for (const slot of ordered) {
              if (!slot.assetId) continue;
              try {
                const attachRes = await http.request<{ mediaVersion: number }>(
                  `/v1/me/adverts/${advertId}/media`,
                  {
                    method: 'POST',
                    accessToken: token,
                    body: JSON.stringify({
                      assetId: slot.assetId,
                      expectedMediaVersion: mediaVersion,
                    }),
                  }
                );
                if (attachRes && typeof attachRes.mediaVersion === 'number') {
                  mediaVersion = attachRes.mediaVersion;
                }
              } catch (e) {
                console.warn('Failed to attach media to ekuri advert:', e);
              }
            }

            if (coverSlot?.assetId) {
              try {
                const coverRes = await http.request<{ mediaVersion: number }>(
                  `/v1/me/adverts/${advertId}/media/cover`,
                  {
                    method: 'PUT',
                    accessToken: token,
                    body: JSON.stringify({
                      assetId: coverSlot.assetId,
                      expectedMediaVersion: mediaVersion,
                    }),
                  }
                );
                if (coverRes && typeof coverRes.mediaVersion === 'number') {
                  mediaVersion = coverRes.mediaVersion;
                }
              } catch (e) {
                // cover best-effort
              }
            }
          } catch (e: any) {
            console.warn('Failed in media sync for ekuri item:', e);
            throw new Error(e?.message || `"${it.draft.details.title || `${i + 1}. İlan`}" için görseller yüklenemedi.`);
          }
        }

        // Set package
        const packageCode = selectedPackageCode || it.draft.packageCode || 'BASIC';
        try {
          await http.request(`/v1/me/adverts/${advertId}/package`, {
            method: 'PUT',
            accessToken: token,
            body: JSON.stringify({ packageCode }),
          });
        } catch (e) {
          console.warn('Failed to set package on ekuri advert:', e);
        }

        // Fetch fresh advert state for expectedVersion before submit
        let submitVersion = currentVersion;
        try {
          const freshAdvert = await http.request<{ id: number; version: number }>(
            `/v1/me/adverts/${advertId}`,
            { method: 'GET', accessToken: token }
          );
          if (freshAdvert?.version) {
            submitVersion = freshAdvert.version;
          }
        } catch {}

        // Submit advert for review
        try {
          await http.request(`/v1/me/adverts/${advertId}/submit`, {
            method: 'POST',
            accessToken: token,
            body: JSON.stringify({ expectedVersion: submitVersion }),
          });
        } catch (e) {
          console.warn(`Failed to submit advert ${advertId} for review:`, e);
        }
      }

      setCreatedBundleId(bundleId);
      setStep('success');
      clearEkuriDraft();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Eküri ilanları oluşturulurken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Top Header & Stepper (identical to Single Listing Wizard) */}
      <View
        style={[
          styles.top,
          { backgroundColor: cardBg, borderBottomColor: border },
        ]}
      >
        <View
          style={[
            styles.topInner,
            isWide && { maxWidth: contentMax, width: '100%', alignSelf: 'center' },
          ]}
        >
          <Pressable
            onPress={handleExit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            style={({ pressed }) => [styles.close, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="close" size={22} color={text} />
          </Pressable>
          <View style={styles.brandContainer} pointerEvents="none">
            <Text style={[styles.brand, { color: text }]}>İlan Ver</Text>
          </View>
          {step !== 'success' ? (
            <Pressable
              onPress={handleSwitchToSingle}
              accessibilityRole="button"
              accessibilityLabel="Tekil İlan Ver"
              style={({ pressed, hovered }: any) => [
                styles.singleModeBtn,
                {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
                  backgroundColor: pressed
                    ? isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'
                    : hovered
                    ? isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
                    : isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                },
              ]}
            >
              <Ionicons name="document-text-outline" size={14} color={primary} />
              <Text style={[styles.singleModeBtnText, { color: text }]}>
                {isWide ? 'Tekil İlan Ver' : 'Tekil'}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.close} />
          )}
        </View>

        {/* Stepper (matching PostStepper layout) */}
        <View
          style={[
            styles.stepWrap,
            isWide && { maxWidth: contentMax, width: '100%', alignSelf: 'center' },
          ]}
        >
          <View style={styles.stepperRow} accessibilityRole="tablist">
            {EKURI_STEPPER_ITEMS.map((item, index) => {
              const done = index < activeIndex;
              const active = index === activeIndex;
              const color = active ? primary : done ? success : textMuted;
              return (
                <React.Fragment key={item.key}>
                  {index > 0 ? (
                    <View
                      style={[
                        styles.stepperLine,
                        { backgroundColor: index <= activeIndex ? primary : border },
                      ]}
                    />
                  ) : null}
                  <Pressable
                    onPress={() => handlePressStep(item.key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={styles.stepperItem}
                  >
                    <View
                      style={[
                        styles.stepperDot,
                        {
                          backgroundColor: active || done ? color : 'transparent',
                          borderColor: color,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepperNum,
                          { color: active || done ? '#ffffff' : color },
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.stepperLabel,
                        {
                          color: active ? text : textMuted,
                          fontWeight: active ? '700' : '500',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                </React.Fragment>
              );
            })}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Error message */}
        {submitError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#ef4444" />
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        )}

        {/* STEP 1: LISTINGS OVERVIEW */}
        {step === 'listings' && (
          <View style={styles.stepContainer}>
            <View style={[styles.sectionHeader, isWide && styles.sectionHeaderWide]}>
              <View style={styles.sectionHeaderTitleCol}>
                <Text style={[styles.sectionTitle, { color: text }]}>Eküri İlanlarınızı Ekleyin</Text>
                <Text style={[styles.sectionSubtitle, { color: textMuted }]}>
                  En az 2, en fazla 10 adet ilan ekleyerek tek seferde avantajlı paketle yayınlayın.
                </Text>
              </View>
              <View style={[styles.sectionHeaderActions, !isWide && styles.sectionHeaderActionsMobile]}>
                <Pressable
                  onPress={handleResetDraft}
                  style={[styles.resetDraftBtn, { borderColor: border }]}
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={14} color={textMuted} />
                  <Text style={[styles.resetDraftText, { color: textMuted }]}>Taslağı Sıfırla</Text>
                </Pressable>
                <View style={[styles.counterPill, { backgroundColor: `${primary}18` }]}>
                  <Ionicons name="documents-outline" size={16} color={primary} />
                  <Text style={[styles.counterText, { color: primary }]}>
                    {items.length} / 10 İlan
                  </Text>
                </View>
              </View>
            </View>

            {/* List of listing cards */}
            <View style={styles.listingsList}>
              {items.map((item, index) => {
                const isComplete = item.isCompleted && Boolean(item.draft.details.title?.trim() && item.draft.type);
                const err = validationErrors[item.id];

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => openModal(index)}
                    style={({ pressed }) => [
                      styles.listingCard,
                      {
                        backgroundColor: cardBg,
                        borderColor: err ? '#ef4444' : isComplete ? '#10b98135' : border,
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}
                  >
                    <View style={styles.cardHeaderLeft}>
                      <View
                        style={[
                          styles.indexCircle,
                          {
                            backgroundColor: isComplete ? 'rgba(16, 185, 129, 0.15)' : `${primary}20`,
                          },
                        ]}
                      >
                        <Text style={[styles.indexText, { color: isComplete ? '#10b981' : primary }]}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.listingCardTitle, { color: text }]} numberOfLines={1}>
                          {item.draft.details.title?.trim() || 'Başlıksız İlan'}
                        </Text>
                        <Text style={[styles.listingCardSub, { color: textMuted }]} numberOfLines={1}>
                          {item.draft.details.priceTl ? `${item.draft.details.priceTl} ₺` : 'Fiyat girilmedi'} •{' '}
                          {item.draft.type?.categoryName || 'Kategori seçilmedi'}
                          {item.draft.media && item.draft.media.length > 0 ? ` • ${item.draft.media.length} Fotoğraf` : ''}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardHeaderRight}>
                      {isComplete ? (
                        <View style={styles.readyBadge}>
                          <Text style={styles.readyBadgeText}>Tamamlandı</Text>
                        </View>
                      ) : (
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingBadgeText}>Eksik</Text>
                        </View>
                      )}
                      <View style={styles.cardActions}>
                        {items.length > 2 && (
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              removeItem(item.id);
                            }}
                            style={styles.trashBtn}
                            hitSlop={8}
                          >
                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                          </Pressable>
                        )}
                        <View style={styles.editIconBtn}>
                          <Ionicons name="create-outline" size={18} color={primary} />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Add Listing Button */}
            {items.length < 10 ? (
              <Pressable onPress={addItem} style={[styles.addBtn, { borderColor: primary }]}>
                <Ionicons name="add-circle-outline" size={22} color={primary} />
                <Text style={[styles.addBtnText, { color: primary }]}>
                  + İlan Ekle (Kalan: {10 - items.length})
                </Text>
              </Pressable>
            ) : (
              <View style={[styles.maxBanner, { borderColor: border }]}>
                <Ionicons name="information-circle-outline" size={18} color={textMuted} />
                <Text style={[styles.maxText, { color: textMuted }]}>
                  Maksimum 10 ilan sınırına ulaştınız.
                </Text>
              </View>
            )}

            {/* Bottom Proceed CTA */}
            <View style={styles.actionRow}>
              <Pressable
                onPress={proceedToPackages}
                style={[styles.primaryBtn, { backgroundColor: primary }]}
              >
                <Text style={styles.primaryBtnText}>
                  Paket Seçimine Geç ({items.length} İlan) →
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 2: PACKAGES */}
        {step === 'package' && (
          <View style={styles.stepContainer}>
            <View style={[styles.sectionHeader, isWide && styles.sectionHeaderWide]}>
              <View style={styles.sectionHeaderTitleCol}>
                <Text style={[styles.sectionTitle, { color: text }]}>Eküri Paketinizi Seçin</Text>
                <Text style={[styles.sectionSubtitle, { color: textMuted }]}>
                  Eklediğiniz {items.length} ilan için geçerli eküri paketleri:
                </Text>
              </View>
              <View style={[styles.sectionHeaderActions, !isWide && styles.sectionHeaderActionsMobile]}>
                <Pressable
                  onPress={handleResetDraft}
                  style={[styles.resetDraftBtn, { borderColor: border }]}
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={14} color={textMuted} />
                  <Text style={[styles.resetDraftText, { color: textMuted }]}>Taslağı Sıfırla</Text>
                </Pressable>
              </View>
            </View>

            {/* Active Campaigns & Coupon Section */}
            <View style={styles.promotionsRow}>
              {activeCampaigns.length > 0 ? (
                <View
                  style={[
                    styles.campaignBanner,
                    {
                      backgroundColor: 'rgba(245, 158, 11, 0.08)',
                      borderColor: 'rgba(245, 158, 11, 0.3)',
                    },
                  ]}
                >
                  <View style={styles.campaignHeader}>
                    <Ionicons name="sparkles" size={18} color="#d97706" />
                    <Text style={styles.campaignHeaderTitle}>Aktif Kampanyalar & Fırsatlar</Text>
                  </View>
                  <View style={styles.campaignList}>
                    {activeCampaigns.map((camp) => (
                      <View key={camp.code} style={styles.campaignItem}>
                        <View style={styles.campaignItemTop}>
                          <Text style={[styles.campaignName, { color: text }]}>{camp.name}</Text>
                          {camp.badgeText ? (
                            <View style={styles.campaignBadge}>
                              <Text style={styles.campaignBadgeText}>{camp.badgeText}</Text>
                            </View>
                          ) : null}
                        </View>
                        {camp.description ? (
                          <Text style={[styles.campaignDesc, { color: textMuted }]}>{camp.description}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Coupon Code Input & Applied Card */}
              <View style={[styles.couponSection, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.couponHeaderRow}>
                  <Ionicons name="ticket-outline" size={20} color={text} />
                  <Text style={[styles.couponSectionTitle, { color: text }]}>İndirim Kuponu</Text>
                </View>

                {appliedCoupon?.valid && appliedCoupon.coupon ? (() => {
                  const coupon = getNormalizedCoupon(appliedCoupon);
                  if (!coupon) return null;
                  const fixedTL = Math.round(
                    (coupon.backendDiscountMinor && coupon.backendDiscountMinor > 0
                      ? coupon.backendDiscountMinor
                      : coupon.discountValue > 500
                      ? coupon.discountValue
                      : coupon.discountValue * 100) / 100
                  );

                  return (
                    <View style={[styles.appliedBox, { backgroundColor: `${success}14`, borderColor: success }]}>
                      <View style={styles.appliedLeft}>
                        <Ionicons name="checkmark-circle" size={22} color={success} />
                        <View style={styles.appliedTextCol}>
                          <View style={styles.appliedCodeRow}>
                            <Text style={[styles.appliedCode, { color: text }]}>{coupon.code}</Text>
                            <View style={[styles.appliedDiscountBadge, { backgroundColor: success }]}>
                              <Text style={styles.appliedDiscountBadgeText}>
                                {coupon.isPercentage
                                  ? `%${coupon.discountValue} İndirim`
                                  : `${fixedTL} TL İndirim`}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.appliedName, { color: textMuted }]}>
                            {coupon.name} başarıyla uygulandı
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={handleRemoveCoupon}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Kuponu kaldır"
                        style={({ pressed }) => [
                          styles.removeCouponBtn,
                          { opacity: pressed ? 0.7 : 1 },
                        ]}
                      >
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                        <Text style={[styles.removeCouponText, { color: '#ef4444' }]}>Kaldır</Text>
                      </Pressable>
                    </View>
                  );
                })() : (
                  <View style={styles.couponInputWrapper}>
                    <View style={styles.couponInputRow}>
                      <TextInput
                        value={couponInput}
                        onChangeText={(val) => {
                          setCouponInput(val.toUpperCase());
                          if (couponError) setCouponError(null);
                        }}
                        placeholder="Kupon kodunu giriniz"
                        placeholderTextColor={textMuted}
                        autoCapitalize="characters"
                        style={[
                          styles.couponTextInput,
                          {
                            color: text,
                            borderColor: couponError ? '#ef4444' : border,
                            backgroundColor: cardBg,
                          },
                        ]}
                        onSubmitEditing={() => handleApplyCoupon()}
                      />
                      <Pressable
                        onPress={() => handleApplyCoupon()}
                        disabled={couponLoading || !couponInput.trim()}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          styles.applyCouponBtn,
                          {
                            backgroundColor: couponInput.trim() ? primary : border,
                            opacity: pressed || couponLoading ? 0.8 : 1,
                          },
                        ]}
                      >
                        {couponLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.applyCouponBtnText}>Uygula</Text>
                        )}
                      </Pressable>
                    </View>
                    {couponError ? (
                      <View style={styles.couponErrorRow}>
                        <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                        <Text style={[styles.couponErrorText, { color: '#ef4444' }]}>{couponError}</Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            </View>

            {packagesLoading && packages.length === 0 && (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={primary} />
                <Text style={[styles.loadingText, { color: textMuted }]}>
                  Eküri paketleri yükleniyor...
                </Text>
              </View>
            )}

            {packages.length > 0 && (
              <View style={[styles.packagesGrid, isWide && styles.packagesGridWide]}>
                {packages.map((pkg) => {
                  const capacity = pkg.horseLimit ?? 0;
                  const isSufficient = capacity >= items.length;
                  const isSelected = selectedPackageCode === pkg.code;

                  const discountedMinor = getPackageDiscountedAmount(pkg);
                  const hasDiscount = discountedMinor != null && discountedMinor < pkg.price.amountMinor;
                  const discountPercent =
                    hasDiscount && pkg.price.amountMinor > 0
                      ? Math.round(((pkg.price.amountMinor - discountedMinor) / pkg.price.amountMinor) * 100)
                      : 0;

                  const effectivePriceMinor = discountedMinor != null ? discountedMinor : pkg.price.amountMinor;
                  const pricePerAdvert =
                    capacity > 0 ? Math.round(effectivePriceMinor / 100 / capacity) : null;

                  return (
                    <Pressable
                      key={pkg.code}
                      disabled={!isSufficient}
                      onPress={() => setSelectedPackageCode(pkg.code)}
                      style={({ pressed }) => [
                        styles.packageCard,
                        isWide && styles.packageCardWide,
                        {
                          backgroundColor: cardBg,
                          borderColor: isSelected ? primary : border,
                          opacity: isSufficient ? (pressed ? 0.96 : 1) : 0.55,
                        },
                        isSelected && {
                          backgroundColor: `${primary}08`,
                          borderWidth: 2,
                        },
                      ]}
                    >
                      {/* Top Header */}
                      <View style={styles.packageCardTop}>
                        <View style={styles.pkgTitleRow}>
                          <View style={styles.pkgTitleWithBadge}>
                            <Text style={[styles.pkgName, { color: text }]}>{pkg.name}</Text>
                            {hasDiscount ? (
                              <View style={styles.discountBadge}>
                                <Ionicons name="flash" size={11} color="#16a34a" />
                                <Text style={styles.discountBadgeText}>
                                  {discountPercent > 0 ? `%${discountPercent} İndirim` : 'İndirimli'}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <Ionicons
                            name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                            size={22}
                            color={isSelected ? primary : border}
                          />
                        </View>

                        <View style={styles.pkgBadgeRow}>
                          <View style={[styles.capacityBadge, { backgroundColor: `${primary}18` }]}>
                            <Text style={[styles.capacityBadgeText, { color: primary }]}>
                              {capacity} İlan Kapasiteli
                            </Text>
                          </View>
                          {pkg.durationDays ? (
                            <View style={[styles.durationBadge, { backgroundColor: border }]}>
                              <Text style={[styles.durationBadgeText, { color: textMuted }]}>
                                {pkg.durationDays} Gün
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      {/* Price Section */}
                      <View style={styles.pkgPriceSection}>
                        {hasDiscount ? (
                          <View style={styles.discountedPriceContainer}>
                            <Text style={[styles.originalPriceStrikethrough, { color: textMuted }]}>
                              {formatMoney(pkg.price)}
                            </Text>
                            <Text style={[styles.pkgPrice, { color: success }]}>
                              {formatMoney({
                                amountMinor: effectivePriceMinor,
                                currency: pkg.price.currency,
                              })}
                            </Text>
                          </View>
                        ) : (
                          <Text style={[styles.pkgPrice, { color: primary }]}>
                            {formatMoney(pkg.price)}
                          </Text>
                        )}
                        {pricePerAdvert !== null && (
                          <Text style={[styles.pkgPricePerAd, { color: textMuted }]}>
                            İlan başına ~{pricePerAdvert} ₺
                          </Text>
                        )}
                      </View>

                      <View style={[styles.pkgDivider, { backgroundColor: border }]} />

                      {/* Features List */}
                      {pkg.features && pkg.features.length > 0 && (
                        <View style={styles.featuresList}>
                          {pkg.features.map((f, idx) => (
                            <View key={idx} style={styles.featureItem}>
                              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                              <Text style={[styles.featureText, { color: text }]}>{f.label}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Insufficient Warning */}
                      {!isSufficient && (
                        <View style={styles.insufficientWarning}>
                          <Ionicons name="close-circle-outline" size={14} color="#ef4444" />
                          <Text style={styles.insufficientText}>
                            En fazla {capacity} ilan için geçerlidir (Eklenen: {items.length})
                          </Text>
                        </View>
                      )}

                      {/* Select Action Button */}
                      <View style={styles.cardSelectBtnWrap}>
                        <View
                          style={[
                            styles.cardSelectBtn,
                            !isSufficient
                              ? { backgroundColor: 'transparent', borderColor: border, borderWidth: 1 }
                              : isSelected
                                ? { backgroundColor: primary }
                                : { borderColor: border, borderWidth: 1 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.cardSelectBtnText,
                              {
                                color: !isSufficient
                                  ? textMuted
                                  : isSelected
                                    ? '#ffffff'
                                    : text,
                              },
                            ]}
                          >
                            {!isSufficient
                              ? 'Kapasite Yetersiz'
                              : isSelected
                                ? '✓ Seçilen Paket'
                                : 'Paketi Seç'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.bottomNavRow}>
              <Pressable onPress={() => setStep('listings')} style={[styles.backBtn, { borderColor: border }]}>
                <Ionicons name="arrow-back" size={18} color={text} />
                <Text style={[styles.backBtnText, { color: text }]}>İlanlara Dön</Text>
              </Pressable>

              <Pressable
                disabled={!isSelectedPackageValid}
                onPress={proceedToCheckout}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: primary,
                    opacity: isSelectedPackageValid ? 1 : 0.5,
                  },
                ]}
              >
                <Text style={styles.primaryBtnText}>Ödemeye Geç →</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 3: CHECKOUT (ÖDEME) */}
        {step === 'checkout' && (
          <View style={styles.stepContainer}>
            <View style={styles.paymentIntro}>
              <Text style={[styles.paymentKicker, { color: textMuted }]}>Adım 3 · Ödeme</Text>
              <Text style={[styles.paymentTitle, { color: text }]}>Ödeme Bilgileri</Text>
              <Text style={[styles.paymentLead, { color: textMuted }]}>
                Ödemenizi güvenle tamamlayın.
              </Text>
            </View>

            {/* Sipariş Özeti (Order Summary) */}
            <View style={[styles.summaryBox, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[styles.summaryTitle, { color: text }]}>Sipariş Özeti</Text>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: textMuted }]}>Seçilen Paket</Text>
                <Text style={[styles.summaryVal, { color: text }]}>{selectedPackage?.name}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: textMuted }]}>İlan Sayısı</Text>
                <Text style={[styles.summaryVal, { color: text }]}>{items.length} İlan</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: textMuted }]}>Yayın Süresi</Text>
                <Text style={[styles.summaryVal, { color: text }]}>
                  {selectedPackage?.durationDays ?? 30} Gün
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: textMuted }]}>Paket Fiyatı</Text>
                <Text style={[styles.summaryVal, { color: text }]}>
                  {selectedPackage ? formatMoney(selectedPackage.price) : '0 ₺'}
                </Text>
              </View>

              {campaignDiscountMinor > 0 ? (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: success }]}>
                    Kampanya İndirimi {campaignName ? `(${campaignName})` : ''}
                  </Text>
                  <Text style={[styles.summaryVal, { color: success }]}>
                    -{formatMoney({ amountMinor: campaignDiscountMinor, currency: selectedPackage?.price.currency || 'TRY' })}
                  </Text>
                </View>
              ) : null}

              {couponDiscountMinor > 0 ? (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: success }]}>
                    Kupon İndirimi {couponCode ? `(${couponCode})` : ''}
                  </Text>
                  <Text style={[styles.summaryVal, { color: success }]}>
                    -{formatMoney({ amountMinor: couponDiscountMinor, currency: selectedPackage?.price.currency || 'TRY' })}
                  </Text>
                </View>
              ) : null}

              <View style={[styles.summaryDivider, { backgroundColor: border }]} />

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryTotalLabel, { color: text }]}>Toplam Ödenecek</Text>
                <Text style={[styles.summaryTotalVal, { color: success }]}>
                  {finalPriceMinor === 0
                    ? 'ÜCRETSİZ'
                    : formatMoney({
                        amountMinor: finalPriceMinor,
                        currency: selectedPackage?.price.currency || 'TRY',
                      })}
                </Text>
              </View>
            </View>

            {/* 100% Free Coupon Card */}
            {isFreeWithCoupon ? (
              <View style={[styles.freeSuccessCard, { backgroundColor: `${success}14`, borderColor: success }]}>
                <Ionicons name="checkmark-circle" size={44} color={success} />
                <Text style={[styles.freeSuccessTitle, { color: text }]}>
                  %100 Kupon İndirimi Uygulandı!
                </Text>
                <Text style={[styles.freeSuccessDesc, { color: textMuted }]}>
                  {selectedPackage?.name ? `${selectedPackage.name} paketi ` : ''}ücretsiz tanımlandı. İlanlarınızı hemen incelemeye gönderebilirsiniz.
                </Text>
                <Pressable
                  disabled={submitting}
                  onPress={handleFinalSubmit}
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: primary,
                      alignSelf: 'stretch',
                      justifyContent: 'center',
                      opacity: submitting ? 0.7 : 1,
                      marginTop: 8,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>İlanları Yayına Gönder (Ücretsiz)</Text>
                      <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                    </>
                  )}
                </Pressable>
              </View>
            ) : null}

            {/* Ödeme Yöntemi (Sadece kuponla ücretsiz değilse ve birden fazla ödeme seçeneği aktifse gösterilir) */}
            {!isFreeWithCoupon && paytrEnabled && (
              <View style={{ gap: 8, marginTop: Spacing.xs }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: text }}>Ödeme Yöntemi</Text>
                <View style={styles.methodToggle}>
                  <Pressable
                    style={[
                      styles.methodTab,
                      { borderColor: border },
                      paymentMethod === 'CC' && { backgroundColor: primary, borderColor: primary },
                    ]}
                    onPress={() => setPaymentMethod('CC')}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="card-outline"
                      size={18}
                      color={paymentMethod === 'CC' ? '#ffffff' : text}
                    />
                    <Text
                      style={[
                        styles.methodTabText,
                        { color: paymentMethod === 'CC' ? '#ffffff' : text },
                      ]}
                    >
                      Online Ödeme
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.methodTab,
                      { borderColor: border },
                      paymentMethod === 'TRANSFER' && { backgroundColor: primary, borderColor: primary },
                    ]}
                    onPress={() => setPaymentMethod('TRANSFER')}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="business-outline"
                      size={18}
                      color={paymentMethod === 'TRANSFER' ? '#ffffff' : text}
                    />
                    <Text
                      style={[
                        styles.methodTabText,
                        { color: paymentMethod === 'TRANSFER' ? '#ffffff' : text },
                      ]}
                    >
                      Havale / EFT
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Havale / EFT İçeriği */}
            {!isFreeWithCoupon && paymentMethod === 'TRANSFER' && (
              <View style={styles.transferSection}>
                {/* Sade Bilgilendirme Notu */}
                <View
                  style={[
                    styles.infoCard,
                    {
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff',
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#bfdbfe',
                    },
                  ]}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={22}
                    color={isDark ? '#60a5fa' : '#2563eb'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isDark ? '#e2e8f0' : '#1e3a8a', fontSize: 13, lineHeight: 20 }}>
                      Aşağıdaki hesaplardan birine{' '}
                      <Text style={{ fontWeight: '700', color: isDark ? '#ffffff' : '#0f172a' }}>
                        {formatMoney({
                          amountMinor: finalPriceMinor,
                          currency: selectedPackage?.price.currency || 'TRY',
                        })}
                      </Text>{' '}
                      gönderiniz.
                    </Text>
                    <Text style={{ color: isDark ? '#94a3b8' : '#475569', fontSize: 13, marginTop: 2 }}>
                      Banka transferi yaparken açıklama kısmına telefon numarası yerine aşağıdaki{' '}
                      <Text style={{ fontWeight: '700', color: isDark ? '#60a5fa' : '#2563eb' }}>Eküri Kodu</Text>
                      'nu yazınız.
                    </Text>
                  </View>
                </View>

                {/* Eküri Kodu Kutusu (Açıklama Alanı için) */}
                <View
                  style={[
                    styles.codeBox,
                    {
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#f8fafc',
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#cbd5e1',
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: isDark ? '#94a3b8' : '#64748b',
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Havale / EFT Açıklama Kodu (Eküri Kodu)
                    </Text>
                    <Text
                      style={{
                        color: primary,
                        fontSize: 20,
                        fontWeight: '800',
                        marginTop: 2,
                        letterSpacing: 1.5,
                      }}
                      selectable
                    >
                      {ekuriCode}
                    </Text>
                  </View>
                  <Pressable
                    onPress={async () => {
                      const ok = await copyToClipboard(ekuriCode);
                      if (ok) {
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }
                    }}
                    style={[
                      styles.codeCopyBtn,
                      {
                        backgroundColor: copiedCode
                          ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#dcfce7')
                          : (isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff'),
                        borderColor: copiedCode ? success : primary,
                      },
                    ]}
                  >
                    <Ionicons
                      name={copiedCode ? 'checkmark' : 'copy-outline'}
                      size={15}
                      color={copiedCode ? success : primary}
                    />
                    <Text style={[styles.codeCopyBtnText, { color: copiedCode ? success : primary }]}>
                      {copiedCode ? 'Kopyalandı' : 'Kodu Kopyala'}
                    </Text>
                  </Pressable>
                </View>

                {/* Banka Kartları */}
                {loadingBanks ? (
                  <ActivityIndicator size="small" color={primary} style={{ marginVertical: Spacing.lg }} />
                ) : bankAccounts.length === 0 ? (
                  <Text style={{ color: textMuted, textAlign: 'center', marginVertical: Spacing.md }}>
                    Kayıtlı banka hesabı bulunamadı.
                  </Text>
                ) : (
                  <View style={styles.banksList}>
                    {bankAccounts.map((acc) => {
                      const isCopied = copiedIban === acc.iban;
                      const formatted = formatIban(acc.iban);

                      return (
                        <View
                          key={acc.id}
                          style={[styles.bankCard, { borderColor: border, backgroundColor: cardBg }]}
                        >
                          <View style={styles.bankTopRow}>
                            <Text style={[styles.bankName, { color: text }]}>{acc.bank_name}</Text>
                            <Text style={[styles.bankHolder, { color: textMuted }]}>{acc.account_holder}</Text>
                          </View>

                          <View
                            style={[
                              styles.ibanBox,
                              {
                                backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : '#f8fafc',
                                borderColor: border,
                              },
                            ]}
                          >
                            <Text style={[styles.ibanText, { color: text }]} numberOfLines={1} selectable>
                              {formatted}
                            </Text>
                            <Pressable
                              onPress={async () => {
                                const ok = await copyToClipboard(acc.iban.replace(/\s+/g, ''));
                                if (ok) {
                                  setCopiedIban(acc.iban);
                                  setTimeout(() => setCopiedIban(null), 2000);
                                }
                              }}
                              style={styles.copyBtn}
                            >
                              <Ionicons
                                name={isCopied ? 'checkmark' : 'copy-outline'}
                                size={15}
                                color={isCopied ? success : primary}
                              />
                              <Text style={[styles.copyBtnText, { color: isCopied ? success : primary }]}>
                                {isCopied ? 'Kopyalandı' : 'Kopyala'}
                              </Text>
                            </Pressable>
                          </View>

                          {(acc.branch_name || acc.account_number) && (
                            <View style={styles.branchRow}>
                              {acc.branch_name && (
                                <Text style={[styles.branchText, { color: textMuted }]}>
                                  Şube: {acc.branch_name}
                                </Text>
                              )}
                              {acc.account_number && (
                                <Text style={[styles.branchText, { color: textMuted }]}>
                                  Hesap No: {acc.account_number}
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                <Pressable
                  disabled={submitting}
                  onPress={handleFinalSubmit}
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: primary,
                      alignSelf: 'stretch',
                      justifyContent: 'center',
                      opacity: submitting ? 0.7 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Ödemeyi Yaptım / Devam Et</Text>
                      <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {/* Online Ödeme / PayTR İçeriği */}
            {!isFreeWithCoupon && paymentMethod === 'CC' && (
              <View style={styles.transferSection}>
                <View
                  style={[
                    styles.infoCard,
                    {
                      backgroundColor: isDark ? 'rgba(66, 214, 151, 0.08)' : '#f0fdf4',
                      borderColor: isDark ? 'rgba(66, 214, 151, 0.25)' : '#bbf7d0',
                    },
                  ]}
                >
                  <Ionicons name="shield-checkmark" size={22} color={success} />
                  <Text style={{ flex: 1, color: isDark ? '#86efac' : '#166534', fontSize: 13, lineHeight: 18 }}>
                    PayTR 256-bit SSL korumalı altyapısıyla güvenli bir şekilde ödeme yapabilirsiniz.
                  </Text>
                </View>

                <Pressable
                  disabled={submitting}
                  onPress={handleFinalSubmit}
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: primary,
                      alignSelf: 'stretch',
                      justifyContent: 'center',
                      opacity: submitting ? 0.7 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>
                        Online Ödeme ile Onayla ({formatMoney({
                          amountMinor: finalPriceMinor,
                          currency: selectedPackage?.price.currency || 'TRY',
                        })})
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                    </>
                  )}
                </Pressable>
              </View>
            )}

            <View style={styles.bottomNavRow}>
              <Pressable onPress={() => setStep('package')} style={[styles.backBtn, { borderColor: border }]}>
                <Ionicons name="arrow-back" size={18} color={text} />
                <Text style={[styles.backBtnText, { color: text }]}>Paket Değiştir</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 4: GÖNDER (ONAY & İNCELEME) - Tekil ilandaki PostReviewStep gibi */}
        {step === 'success' && (
          <View style={styles.reviewContainer}>
            {/* 1. Hero / Header */}
            <View style={styles.reviewHero}>
              <View style={styles.iconHalo}>
                <View style={[styles.iconCore, { backgroundColor: success }]}>
                  <Ionicons name="checkmark" size={28} color="#ffffff" />
                </View>
              </View>

              <Text style={[styles.reviewTitle, { color: text }]}>
                Eküri İlanlarınız İncelemeye Alındı
              </Text>
              <Text style={[styles.reviewSubtitle, { color: textMuted }]}>
                Toplam {items.length} adet ilanınız başarıyla kaydedildi ve eküri çatısı altında editör ekibimize ulaştı. Kontroller tamamlandıktan sonra en kısa sürede yayına alınacaktır.
              </Text>
            </View>

            {/* 2. Tek Parça Sade ve Estetik Eküri Kartı */}
            <View style={[styles.reviewCard, { backgroundColor: cardBg, borderColor: border }]}>
              {/* Üst Kısım: Eküri Grup No & Kopyala */}
              {createdBundleId ? (
                <View style={[styles.reviewMetaRow, { borderBottomColor: border }]}>
                  <View style={styles.reviewMetaLeft}>
                    <Text style={[styles.reviewMetaLabel, { color: textMuted }]}>Eküri Grup No</Text>
                    <Text style={[styles.reviewMetaValue, { color: text }]} selectable>
                      #{createdBundleId.substring(0, 8).toUpperCase()}
                    </Text>
                  </View>
                  <Pressable
                    onPress={async () => {
                      const ok = await copyToClipboard(createdBundleId);
                      if (ok) {
                        setBundleCopied(true);
                        setTimeout(() => setBundleCopied(false), 2000);
                      }
                    }}
                    style={[
                      styles.copyBtn,
                      {
                        borderColor: bundleCopied ? success : border,
                        backgroundColor: bundleCopied ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 0, 0, 0.03)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={bundleCopied ? 'checkmark' : 'copy-outline'}
                      size={15}
                      color={bundleCopied ? success : textMuted}
                    />
                    <Text style={[styles.copyBtnText, { color: bundleCopied ? success : text }]}>
                      {bundleCopied ? 'Kopyalandı' : 'Kopyala'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Paket Özet Satırı */}
              <View style={[styles.reviewPkgRow, { borderBottomColor: border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reviewPkgTitle, { color: text }]}>
                    {selectedPackage?.name} ({items.length} İlanlık Eküri Paketi)
                  </Text>
                  <Text style={[styles.reviewPkgSub, { color: textMuted }]}>
                    Yayın Süresi: {selectedPackage?.durationDays ?? 30} Gün · Tutar: {selectedPackage ? formatMoney(selectedPackage.price) : '0 ₺'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                  <View style={[styles.statusDot, { backgroundColor: '#f59e0b' }]} />
                  <Text style={[styles.statusText, { color: '#d97706' }]}>İncelemede</Text>
                </View>
              </View>

              {/* Eküri İlanları Listesi */}
              <View style={styles.reviewAdvertsList}>
                {items.map((it, idx) => {
                  const coverUri = it.draft.media.find((m) => m.isCover)?.uri || it.draft.media[0]?.uri;
                  return (
                    <View key={it.id} style={[styles.reviewAdvertItem, idx > 0 && { borderTopWidth: 1, borderTopColor: border }]}>
                      {coverUri ? (
                        <Image source={{ uri: coverUri }} style={styles.reviewThumb} />
                      ) : (
                        <View style={[styles.reviewThumbPlaceholder, { backgroundColor: `${primary}12` }]}>
                          <Ionicons name="images-outline" size={18} color={primary} />
                        </View>
                      )}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.reviewAdvertTitle, { color: text }]} numberOfLines={1}>
                          {idx + 1}. {it.draft.details.title || 'Başlıksız İlan'}
                        </Text>
                        <Text style={[styles.reviewAdvertCat, { color: textMuted }]} numberOfLines={1}>
                          {it.draft.type?.categoryName || 'İlan'} · {it.draft.details.priceTl ? `${it.draft.details.priceTl} TL` : 'Fiyat Belirtilmemiş'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Aksiyon Butonları (Tekil ilandaki gibi) */}
            <View style={styles.reviewButtonsRow}>
              <Pressable
                onPress={() => router.push('/my-listings')}
                style={[styles.primaryBtn, { backgroundColor: primary, flex: 1, justifyContent: 'center' }]}
              >
                <Ionicons name="list" size={18} color="#ffffff" />
                <Text style={styles.primaryBtnText}>İlanlarıma Git</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/')}
                style={[styles.backBtn, { borderColor: border, flex: 1, justifyContent: 'center' }]}
              >
                <Ionicons name="home-outline" size={18} color={text} />
                <Text style={[styles.backBtnText, { color: text }]}>Ana Sayfa</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  clearEkuriDraft();
                  setItems([createEmptyEkuriItem(1), createEmptyEkuriItem(2)]);
                  setSelectedPackageCode(null);
                  setCreatedBundleId(null);
                  setEkuriCode(generateEkuriCode());
                  setStep('listings');
                }}
                style={[styles.backBtn, { borderColor: border, flex: 1, justifyContent: 'center' }]}
              >
                <Ionicons name="add-circle-outline" size={18} color={text} />
                <Text style={[styles.backBtnText, { color: text }]}>Yeni Eküri İlanı</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* POPUP / MODAL: Taslağı Sıfırla Onayı */}
      {resetConfirmVisible && (
        <View style={[styles.modalOverlay, StyleSheet.absoluteFillObject]}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setResetConfirmVisible(false)}
          />
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: cardBg,
                borderColor: border,
                width: isWide ? 440 : '90%',
                padding: Spacing.lg,
                gap: Spacing.md,
                alignSelf: 'center',
                zIndex: 1001,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#fee2e2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: text }}>
                  Taslağı Sıfırla
                </Text>
                <Text style={{ fontSize: 13, color: textMuted, marginTop: 2 }}>
                  Tüm eküri ilanları temizlenecek
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 14, color: text, lineHeight: 20 }}>
              Girdiğiniz tüm eküri bilgileri ve eklenen ilanlar temizlenecektir. Devam etmek istiyor musunuz?
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <Pressable
                onPress={() => setResetConfirmVisible(false)}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: text }}>Vazgeç</Text>
              </Pressable>
              <Pressable
                onPress={executeReset}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: '#dc2626',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff' }}>
                  Evet, Sıfırla
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* POPUP / MODAL: İlan Düzenleme ve Dinamik Form Akışı */}
      {modalVisible && (
        <View style={[styles.modalOverlay, StyleSheet.absoluteFillObject]}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: cardBg,
                borderColor: border,
                width: isWide ? 820 : '95%',
                maxHeight: isWide ? '90%' : '94%',
              },
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: border }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.modalTitle, { color: text }]}>
                    {(editingIndex ?? 0) + 1}. İlan Bilgileri
                  </Text>
                  <View style={[styles.modalStepBadge, { backgroundColor: `${primary}18` }]}>
                    <Text style={[styles.modalStepBadgeText, { color: primary }]}>
                      {modalStep === 'category' ? 'Adım 1/2 · Kategori Seçimi' : 'Adım 2/2 · İlan Detayları'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.modalSubtitle, { color: textMuted }]}>
                  {modalStep === 'category'
                    ? 'İlan vermek istediğiniz kategoriyi seçiniz.'
                    : 'Kategoriye uygun ilan detaylarını doldurunuz.'}
                </Text>
              </View>

              <Pressable
                onPress={handleCloseModal}
                style={[styles.modalCloseBtn, { borderColor: border }]}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color={text} />
              </Pressable>
            </View>

            {/* Modal Errors Banner */}
            {modalErrorBanner && (
              <View style={styles.modalErrorBanner}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.modalErrorText}>{modalErrorBanner}</Text>
              </View>
            )}

            {/* Modal Body: STEP 1 - Kategori Seçimi (Tekil ilandaki gibi root menü ile başlar) */}
            {modalStep === 'category' ? (
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {categoryPhase === 'category' && (
                  <Pressable
                    onPress={() => {
                      setCategoryPhase('root');
                      setSelectedRootSlug(null);
                    }}
                    style={styles.modalBackToRootsBtn}
                  >
                    <Ionicons name="arrow-back" size={16} color={primary} />
                    <Text style={[styles.modalBackToRootsText, { color: primary }]}>
                      Tüm Kategorilere Dön
                    </Text>
                  </Pressable>
                )}

                <PostTypeStep
                  phase={categoryPhase}
                  categoryTree={categoryTree}
                  selectedRootSlug={selectedRootSlug}
                  selectedType={editingDraft?.type ?? null}
                  loading={catalogLoading}
                  error={catalogError}
                  onSelectRoot={(root) => {
                    setSelectedRootSlug(root.categorySlug);
                    setCategoryPhase('category');
                  }}
                  onSelectType={(type) => {
                    if (!editingDraft) return;
                    const isDifferent =
                      editingDraft.type?.categoryId !== type.categoryId ||
                      editingDraft.type?.categorySlug !== type.categorySlug;
                    const isHorse = isHorseListing(type);
                    const isTransport = isTransportListing(type);
                    const isPansiyon = isPansiyonListing(type);
                    const isStud = isStudServiceListing(type);

                    const nextDetails = isDifferent
                      ? {
                          ...editingDraft.details,
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
                          ...(isTransport
                            ? {}
                            : {
                                companyName: '',
                                websiteUrl: '',
                              }),
                          ...(isPansiyon
                            ? {}
                            : {
                                facilityGrassPaddock: false,
                                facilitySandPaddock: false,
                                facilityStallionPaddock: false,
                                facilityTrainingTrack: false,
                                facilityVeterinarian: false,
                                facilityFarrier: false,
                                facilityFoalingBarn: false,
                              }),
                          ...(isStud
                            ? {
                                gender: 'Erkek' as const,
                              }
                            : {
                                studBreed: '',
                                studAge: '',
                                studCoatColor: '',
                                studHorseName: '',
                                studSire: '',
                                studDam: '',
                                studDamsire: '',
                              }),
                        }
                      : editingDraft.details;

                    setEditingDraft({
                      ...editingDraft,
                      type,
                      details: nextDetails,
                    });
                    setModalTjkPromptSeen(false);
                    setModalFieldErrors({});
                    setModalStep('details');
                    setCategoryPhase('root');
                    setSelectedRootSlug(null);
                    setModalErrorBanner(null);
                  }}
                  onBack={() => {
                    setCategoryPhase('root');
                    setSelectedRootSlug(null);
                  }}
                />
              </ScrollView>
            ) : (
              /* Modal Body: STEP 2 - Dinamik İlan Bilgileri Formu (PostDetailsStep) */
              <ScrollView
                ref={modalScrollRef}
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={true}
              >
                {/* Selected Category Header Banner */}
                <View
                  style={[
                    styles.selectedCatBanner,
                    { backgroundColor: `${primary}12`, borderColor: `${primary}35` },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Ionicons
                      name={getCategoryIcon(editingDraft?.type?.categorySlug || '')}
                      size={18}
                      color={primary}
                    />
                    <View>
                      <Text style={{ fontSize: 11, color: textMuted }}>Seçilen Kategori</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: primary }}>
                        {editingDraft?.type?.categoryName || 'Kategori Seçilmedi'}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => {
                      setModalStep('category');
                      setCategoryPhase('root');
                      setSelectedRootSlug(null);
                      setModalErrorBanner(null);
                    }}
                    style={[styles.changeCatBtn, { borderColor: primary }]}
                  >
                    <Ionicons name="swap-horizontal" size={14} color={primary} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: primary }}>
                      Kategoriyi Değiştir
                    </Text>
                  </Pressable>
                </View>

                {/* Dinamik Alanlar: PostDetailsStep */}
                {editingDraft && (
                  <PostDetailsStep
                    draft={editingDraft}
                    errors={modalFieldErrors}
                    globalConfigs={globalConfigs}
                    customGlobalProperties={customGlobalProperties}
                    tjkPromptSeen={modalTjkPromptSeen}
                    scrollViewRef={modalScrollRef}
                    scrollTrigger={modalScrollTrigger}
                    onUpdate={handleUpdateDetails}
                    onMediaChange={handleMediaChange}
                    onSetCover={handleSetCover}
                    onApplyTjk={handleApplyTjk}
                    onSkipTjk={handleSkipTjk}
                    onMarkTjkSeen={handleMarkTjkSeen}
                    onCategoryPropertiesLoaded={handleCategoryPropertiesLoaded}
                  />
                )}
              </ScrollView>
            )}

            {/* Modal Bottom Footer */}
            <View style={[styles.modalFooter, { borderTopColor: border }]}>
              {modalStep === 'details' ? (
                <Pressable
                  onPress={() => {
                    setModalStep('category');
                    setCategoryPhase('root');
                    setSelectedRootSlug(null);
                    setModalErrorBanner(null);
                  }}
                  style={[styles.modalBackBtn, { borderColor: border }]}
                >
                  <Ionicons name="arrow-back" size={16} color={text} />
                  <Text style={[styles.modalBackBtnText, { color: text }]}>Kategoriye Dön</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleCloseModal}
                  style={[styles.modalBackBtn, { borderColor: border }]}
                >
                  <Text style={[styles.modalBackBtnText, { color: text }]}>Vazgeç</Text>
                </Pressable>
              )}

              {modalStep === 'details' ? (
                <Pressable
                  onPress={handleCompleteItem}
                  style={[styles.modalSaveBtn, { backgroundColor: primary }]}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                  <Text style={styles.modalSaveBtnText}>İlanı Tamamla</Text>
                </Pressable>
              ) : (
                <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, color: textMuted }}>
                    Devam etmek için bir kategori seçin
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  top: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.md,
  },
  topInner: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    minHeight: 44,
  },
  brandContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  singleModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 1,
  },
  singleModeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  brand: {
    ...Typography.h5,
    fontWeight: '700',
  },
  stepWrap: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperItem: {
    alignItems: 'center',
    gap: 6,
    minWidth: 52,
  },
  stepperDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperNum: {
    ...Typography.caption,
    fontWeight: '700',
  },
  stepperLabel: {
    ...Typography.caption,
  },
  stepperLine: {
    flex: 1,
    height: 1.5,
    marginBottom: 18,
    marginHorizontal: 4,
  },
  scrollBody: {
    padding: Spacing.lg,
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    padding: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  stepContainer: {
    gap: Spacing.lg,
  },
  sectionHeader: {
    gap: 12,
  },
  sectionHeaderWide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  sectionHeaderTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sectionHeaderActionsMobile: {
    width: '100%',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.h3,
    fontWeight: '700',
    fontSize: 20,
  },
  sectionSubtitle: {
    ...Typography.body,
    fontSize: 13,
    marginTop: 2,
  },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listingsList: {
    gap: Spacing.md,
  },
  listingCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingLeft: 8,
    paddingRight: 4,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  indexCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  indexText: {
    fontWeight: '700',
    fontSize: 14,
  },
  listingCardTitle: {
    ...Typography.h5,
    fontWeight: '700',
    fontSize: 15,
  },
  listingCardSub: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  readyBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  readyBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  pendingBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingBadgeText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trashBtn: {
    padding: 4,
  },
  editIconBtn: {
    padding: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  maxBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
  },
  maxText: {
    fontSize: 13,
  },
  actionRow: {
    marginTop: Spacing.sm,
  },
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  packagesGrid: {
    gap: Spacing.md,
  },
  packagesGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  packageCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: Spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  packageCardWide: {
    flex: 1,
    minWidth: 280,
  },
  packageCardTop: {
    gap: 10,
  },
  pkgTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  pkgName: {
    ...Typography.h4,
    fontWeight: '700',
    fontSize: 18,
    flex: 1,
  },
  pkgBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  capacityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  capacityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pkgPriceSection: {
    paddingVertical: 4,
  },
  pkgPrice: {
    ...Typography.h3,
    fontSize: 26,
    fontWeight: '800',
  },
  pkgPricePerAd: {
    fontSize: 12,
    marginTop: 4,
  },
  pkgDivider: {
    height: 1,
  },
  featuresList: {
    gap: 10,
    flex: 1,
    paddingVertical: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  insufficientWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  insufficientText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  cardSelectBtnWrap: {
    marginTop: Spacing.xs,
  },
  cardSelectBtn: {
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSelectBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bottomNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Step 3: Checkout / Ödeme
  paymentIntro: {
    gap: 6,
    marginBottom: Spacing.xs,
  },
  paymentKicker: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  paymentTitle: {
    ...Typography.h3,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  paymentLead: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  summaryBox: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 8,
  },
  summaryTitle: {
    ...Typography.h3,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  summaryLabel: {
    ...Typography.body,
    fontSize: 14,
    flex: 1,
    minWidth: 0,
  },
  summaryVal: {
    ...Typography.body,
    fontWeight: '600',
    fontSize: 14,
    flexShrink: 0,
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 4,
  },
  summaryTotalLabel: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
    minWidth: 0,
  },
  summaryTotalVal: {
    fontSize: 22,
    fontWeight: '800',
    flexShrink: 0,
    textAlign: 'right',
  },
  methodToggle: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: Radius.card,
  },
  methodTabText: {
    fontWeight: '600',
    fontSize: 14,
  },
  transferSection: {
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: Radius.card,
    borderWidth: 1,
  },
  banksList: {
    gap: 10,
  },
  bankCard: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: 10,
  },
  bankTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankName: {
    fontSize: 15,
    fontWeight: '700',
  },
  bankHolder: {
    fontSize: 13,
  },
  ibanBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  ibanText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.5,
    flex: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.card,
    borderWidth: 1,
    gap: Spacing.md,
  },
  codeCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.card,
    borderWidth: 1,
  },
  codeCopyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  branchRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  branchText: {
    fontSize: 12,
  },

  // Step 4: Gönder (Onay & İnceleme - PostReviewStep gibi)
  reviewContainer: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    gap: 16,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  reviewHero: {
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
  },
  iconHalo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(66, 214, 151, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(66, 214, 151, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCore: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(66, 214, 151, 0.35)',
      },
      default: {
        elevation: 3,
      },
    }),
  },
  reviewTitle: {
    ...Typography.h3,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  reviewSubtitle: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 440,
    paddingHorizontal: Spacing.sm,
  },
  reviewCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
      },
      default: {
        elevation: 1,
      },
    }),
  },
  reviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(15, 23, 42, 0.02)',
  },
  reviewMetaLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  reviewMetaLabel: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  reviewMetaValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    fontVariant: Platform.OS === 'web' ? (['tabular-nums'] as const) : undefined,
  },
  reviewPkgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewPkgTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  reviewPkgSub: {
    fontSize: 12,
    marginTop: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewAdvertsList: {
    padding: Spacing.md,
    gap: 10,
  },
  reviewAdvertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  reviewThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  reviewThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAdvertTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  reviewAdvertCat: {
    fontSize: 12,
    marginTop: 2,
  },
  reviewButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' as any } as const) : {}),
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 24,
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.h4,
    fontWeight: '700',
    fontSize: 17,
  },
  modalSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  modalStepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  modalStepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  modalErrorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalBackToRootsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  modalBackToRootsText: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectedCatBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  changeCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  modalBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalBackBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  modalSaveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  resetDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetDraftText: {
    fontSize: 12,
    fontWeight: '500',
  },

  /* Promotions Row */
  promotionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    alignItems: 'stretch',
    marginBottom: Spacing.md,
  },

  /* Campaigns Banner */
  campaignBanner: {
    flex: 1,
    flexBasis: 260,
    minWidth: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 8,
    justifyContent: 'center',
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  campaignHeaderTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: '#b45309',
  },
  campaignList: {
    gap: 6,
  },
  campaignItem: {
    gap: 2,
  },
  campaignItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  campaignName: {
    ...Typography.small,
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
  },
  campaignBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 0,
  },
  campaignBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  campaignDesc: {
    ...Typography.caption,
  },

  /* Coupon Section */
  couponSection: {
    flex: 1,
    flexBasis: 260,
    minWidth: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 12,
    justifyContent: 'center',
  },
  couponHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponSectionTitle: {
    ...Typography.body,
    fontWeight: '700',
  },
  couponInputWrapper: {
    gap: 8,
    width: '100%',
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    width: '100%',
  },
  couponTextInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  applyCouponBtn: {
    flexShrink: 0,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyCouponBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  couponErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  couponErrorText: {
    ...Typography.small,
  },
  appliedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  appliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  appliedTextCol: {
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  appliedCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  appliedCode: {
    fontWeight: '800',
    fontSize: 15,
  },
  appliedDiscountBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  appliedDiscountBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  appliedName: {
    fontSize: 12,
  },
  removeCouponBtn: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  removeCouponText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Card Discount Elements */
  pkgTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    borderColor: 'rgba(22, 163, 74, 0.3)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountBadgeText: {
    color: '#16a34a',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  discountedPriceContainer: {
    flexDirection: 'column',
    gap: 2,
  },
  originalPriceStrikethrough: {
    fontSize: 13,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },

  /* Free Coupon Card */
  freeSuccessCard: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 10,
  },
  freeSuccessTitle: {
    ...Typography.h3,
    fontWeight: '700',
    textAlign: 'center',
  },
  freeSuccessDesc: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 20,
  },
});
