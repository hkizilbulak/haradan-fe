import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PostWizardShell } from './PostWizardShell';
import { PostTypeStep } from './PostTypeStep';
import { PostDetailsStep } from './PostDetailsStep';
import { PostPackagesStep } from './PostPackagesStep';
import { PostPaymentStep } from './PostPaymentStep';
import { PostReviewStep } from './PostReviewStep';
import { PostAdvertPreviewModal } from './PostAdvertPreviewModal';
import { useCatalogFacets } from '@/hooks/useCatalogFacets';
import { useListingPackages } from '@/hooks/useListingPackages';
import { useListingWizard } from '@/hooks/useListingWizard';
import { useListingWizardBack } from '@/hooks/useListingWizardBack';
import { useAuthSession } from '@/hooks/useAuthSession';
import { getValidAccessToken } from '@/services/auth';
import { catalogRepository } from '@/services/catalog';
import {
  getGlobalPropertiesConfig,
  setGlobalPropertiesConfig,
  type GlobalPropertiesMap,
} from '@/services/catalog/addressConfig';
import {
  detailsErrors,
  isListingPackageStepEnabled,
  isPaytrCheckoutEnabled,
  resetListingWizard,
} from '@/services/listing';
import { parseInternationalPhone } from '@/services/phone';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { CategoryPropertyPublic } from '@/types';
import type { ListingWizardStep } from '@/types/listing';

type PostWizardViewProps = {
  onSwitchToEkuri?: () => void;
};

export function PostWizardView({ onSwitchToEkuri }: PostWizardViewProps = {}) {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [loadedCategoryProperties, setLoadedCategoryProperties] = useState<CategoryPropertyPublic[]>([]);
  const [globalConfigs, setGlobalConfigs] = useState<GlobalPropertiesMap>(getGlobalPropertiesConfig());
  const [customGlobalProperties, setCustomGlobalProperties] = useState<CategoryPropertyPublic[]>([]);
  const { session, isLoggedIn } = useAuthSession();
  const { categoryTree, error: catalogError, loading: catalogLoading } = useCatalogFacets();
  const wizard = useListingWizard();
  const { packages, error: packageError } = useListingPackages(undefined, {
    enabled:
      wizard.step === 'package' ||
      wizard.step === 'payment' ||
      wizard.step === 'review',
  });

  const individualPackages = useMemo(() => {
    return (packages ?? []).filter((p) => p.packageType !== 'EKURI');
  }, [packages]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const packageStepEnabled = isListingPackageStepEnabled();
  const paytrEnabled = packageStepEnabled && isPaytrCheckoutEnabled();
  const [paymentMethod, setPaymentMethod] = useState<'CC' | 'TRANSFER'>(paytrEnabled ? 'CC' : 'TRANSFER');
  const errorColor = useThemeColor('error');

  const { back, unwindAndExit } = useListingWizardBack({
    step: wizard.step,
    typePhase: wizard.typePhase,
    goBack: wizard.goBack,
  });

  const { updateDetails } = wizard;
  const sellerPhone = wizard.draft.details.sellerPhone;

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

  useEffect(() => {
    const phone = session?.user.phone;
    if (phone && !sellerPhone) {
      const parsed = parseInternationalPhone(phone);
      updateDetails({
        phoneCountryIso: parsed.iso,
        sellerPhone: parsed.national,
      });
    }
  }, [session?.user.phone, sellerPhone, updateDetails]);

  const close = useCallback(() => {
    resetListingWizard();
    unwindAndExit(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    });
  }, [router, unwindAndExit]);

  const submitListing = useCallback(async () => {
    if (!isLoggedIn) {
      router.push('/auth/login?next=/post');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = await getValidAccessToken();
      if (!token) {
        router.push('/auth/login?next=/post');
        return;
      }
      if (paytrEnabled) {
        await wizard.startPaidCheckout(token);
      } else {
        if (!wizard.draft.advertId && !wizard.draftAdvertId) {
          await wizard.persistDraftAndStartMedia(token);
        }
        wizard.setStep('payment');
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : paytrEnabled
            ? 'Ödeme başlatılamadı.'
            : 'İlan gönderilemedi.'
      );
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setSubmitting(false);
    }
  }, [wizard, isLoggedIn, router, paytrEnabled]);

  const activeCategoryProperties =
    wizard.categoryProperties ?? (loadedCategoryProperties.length > 0 ? loadedCategoryProperties : undefined);

  const currentFieldErrors = useMemo(
    () =>
      wizard.detailsAttempted
        ? detailsErrors(
            wizard.draft,
            activeCategoryProperties,
            globalConfigs,
            customGlobalProperties
          )
        : {},
    [
      wizard.draft,
      wizard.detailsAttempted,
      activeCategoryProperties,
      globalConfigs,
      customGlobalProperties,
    ]
  );

  const onNext = useCallback(async () => {
    setSubmitError(null);
    if (wizard.step === 'details') {
      const errs = detailsErrors(
        wizard.draft,
        activeCategoryProperties,
        globalConfigs,
        customGlobalProperties
      );
      if (Object.keys(errs).length > 0) {
        const firstError = Object.values(errs)[0];
        setSubmitError(`Lütfen zorunlu alanları doldurunuz: ${firstError}`);
        wizard.goNext();
        setScrollTrigger((v) => v + 1);
        return;
      }
      if (!isLoggedIn) {
        router.push('/auth/login?next=/post');
        return;
      }
      setSubmitting(true);
      try {
        const token = await getValidAccessToken();
        if (!token) {
          router.push('/auth/login?next=/post');
          return;
        }
        if (!packageStepEnabled) {
          // Direct submit path: persist + media + submit in one CTA.
          await wizard.persistDraftAndStartMedia(token);
          await wizard.publishListing(token);
          return;
        }
        // Persist shell now; media uploads continue on package step.
        await wizard.persistDraftAndStartMedia(token);
        wizard.goNext();
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'İlan kaydedilemedi.'
        );
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (wizard.step === 'package') {
      if (!wizard.draft.packageCode) {
        setSubmitError('Devam etmek için bir yayın paketi seçmelisiniz.');
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }
      await submitListing();
      return;
    }
    wizard.goNext();
  }, [
    wizard,
    packageStepEnabled,
    submitListing,
    activeCategoryProperties,
    globalConfigs,
    customGlobalProperties,
    isLoggedIn,
    router,
  ]);

  const paymentStepEnabled = packageStepEnabled;
  const nextLabel =
    wizard.step === 'details' && !packageStepEnabled
      ? 'İncelemeye gönder'
      : wizard.step === 'package'
        ? paymentStepEnabled
          ? 'Ödemeye geç'
          : 'İncelemeye gönder'
        : 'Devam et';
  const showBack =
    wizard.step !== 'review' &&
    (wizard.step !== 'type' || wizard.typePhase !== 'root');
  const showNext =
    wizard.step === 'details' ||
    (packageStepEnabled && wizard.step === 'package');
  const showPreview =
    (packageStepEnabled && wizard.step === 'package') ||
    (!packageStepEnabled && wizard.step === 'details');

  const selectedPackage = individualPackages.find((p) => p.code === wizard.draft.packageCode);
  const pkgPriceMinor = selectedPackage?.price?.amountMinor ?? 0;
  const calculatedAmountMinor = Math.max(0, pkgPriceMinor - (wizard.appliedCoupon?.discountAmountMinor ?? 0));

  return (
    <>
      <PostWizardShell
        step={wizard.step}
        canNext={wizard.canNext}
        nextLabel={nextLabel}
        nextLoading={submitting}
        showBack={showBack}
        showNext={showNext}
        showPreview={showPreview}
        onPreview={() => setPreviewModalOpen(true)}
        previewLabel="İlan Önizleme"
        scrollViewRef={scrollViewRef}
        onClose={close}
        onBack={back}
        onNext={() => void onNext()}
        onPressStep={(key: ListingWizardStep) => wizard.setStep(key)}
      >
        {wizard.step === 'type' && onSwitchToEkuri ? (
          <Pressable
            onPress={onSwitchToEkuri}
            style={({ pressed }) => [
              styles.ekuriSwitchBanner,
              {
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={styles.ekuriSwitchLeft}>
              <View style={styles.ekuriIconWrap}>
                <Ionicons name="ribbon" size={20} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ekuriSwitchTitle}>Eküri / Toplu İlan mı vereceksiniz?</Text>
                <Text style={styles.ekuriSwitchSubtitle}>
                  10 ata kadar toplu ilan paketi seçip aynı anda yayınlayın
                </Text>
              </View>
            </View>
            <View style={styles.ekuriSwitchBtn}>
              <Text style={styles.ekuriSwitchBtnText}>Eküri İlanı Ver →</Text>
            </View>
          </Pressable>
        ) : null}
        {wizard.step === 'type' ? (
          <PostTypeStep
            phase={wizard.typePhase}
            categoryTree={categoryTree}
            selectedRootSlug={wizard.selectedRootSlug}
            selectedType={wizard.draft.type}
            loading={catalogLoading}
            error={catalogError}
            onSelectRoot={wizard.selectRoot}
            onSelectType={wizard.selectType}
            onBack={back}
          />
        ) : null}
        {wizard.step === 'details' ? (
          <View style={styles.detailsBlock}>
            {submitError ? (
              <Text style={[styles.submitErr, { color: errorColor }]}>{submitError}</Text>
            ) : null}
            <PostDetailsStep
              draft={wizard.draft}
              errors={currentFieldErrors}
              globalConfigs={globalConfigs}
              customGlobalProperties={customGlobalProperties}
              tjkPromptSeen={wizard.tjkPromptSeen}
              scrollViewRef={scrollViewRef}
              scrollTrigger={scrollTrigger}
              onUpdate={wizard.updateDetails}
              onMediaChange={wizard.setMedia}
              onSetCover={wizard.setCover}
              onApplyTjk={wizard.applyTjk}
              onSkipTjk={wizard.skipTjk}
              onMarkTjkSeen={wizard.markTjkPromptSeen}
              onCategoryPropertiesLoaded={setLoadedCategoryProperties}
            />
          </View>
        ) : null}
        {wizard.step === 'package' && packageStepEnabled ? (
          <View>
            {wizard.mediaSyncStatus === 'uploading' ? (
              <Text style={styles.mediaHint}>
                Görseller arka planda yükleniyor — paket seçmeye devam edebilirsiniz.
              </Text>
            ) : null}
            {wizard.mediaSyncStatus === 'error' && wizard.mediaSyncError ? (
              <Text style={[styles.submitErr, { color: errorColor }]}>
                {wizard.mediaSyncError}
              </Text>
            ) : null}
            <PostPackagesStep
              packages={individualPackages}
              selected={wizard.draft.packageCode}
              draft={wizard.draft}
              error={submitError ?? packageError ?? catalogError}
              onSelect={wizard.selectPackage}
              appliedCoupon={wizard.appliedCoupon}
              onApplyCoupon={async (code: string) => {
                const pkg = individualPackages.find((p) => p.code === wizard.draft.packageCode) ?? individualPackages[0];
                const spendAmountMinor = pkg ? pkg.price.amountMinor : 0;
                const token = session?.accessToken;
                return wizard.applyCoupon(code, pkg?.code ?? '', spendAmountMinor, token);
              }}
              onRemoveCoupon={wizard.removeCoupon}
            />
          </View>
        ) : null}
        {wizard.step === 'payment' && paymentStepEnabled ? (
          <PostPaymentStep
            iframeUrl={wizard.paytrIframeUrl}
            packageName={
              selectedPackage?.name ?? wizard.draft.packageCode
            }
            packagePriceMinor={selectedPackage?.price?.amountMinor}
            amountMinor={wizard.paytrAmountMinor ?? calculatedAmountMinor}
            currencyCode={selectedPackage?.price?.currency ?? 'TRY'}
            appliedCoupon={wizard.appliedCoupon}
            error={submitError}
            onRetry={() => {
              setSubmitError(null);
              void submitListing();
            }}
            onSuccessClick={() => {
              wizard.setStep('review');
            }}
            draftAdvertId={
              wizard.submittedDraftId
                ? String(wizard.submittedDraftId)
                : wizard.draftAdvertId
                  ? String(wizard.draftAdvertId)
                  : undefined
            }
            paymentMethod={paymentMethod}
            onChangePaymentMethod={setPaymentMethod}
            onTransferConfirm={async () => {
                setSubmitError(null);
                setSubmitting(true);
                try {
                    const token = await getValidAccessToken();
                    if (token) {
                        await wizard.publishListing(token);
                    }
                } catch (e) {
                    console.error('Failed to submit transfer advert', e);
                    setSubmitError(e instanceof Error ? e.message : 'İlan gönderilemedi.');
                } finally {
                    setSubmitting(false);
                }
            }}
          />
        ) : null}
        {wizard.step === 'review' ? (
          <PostReviewStep
            advertId={wizard.submittedDraftId}
            status={wizard.submittedStatus}
            title={wizard.draft.details.title}
            categoryName={wizard.draft.type?.categoryName}
            priceTl={wizard.draft.details.priceTl}
            coverUri={
              wizard.draft.media.find((m) => m.isCover)?.uri ||
              wizard.draft.media[0]?.uri
            }
            onGoListings={() => {
              resetListingWizard();
              router.replace('/my-listings');
            }}
            onGoHome={() => {
              resetListingWizard();
              router.replace('/');
            }}
            onNewListing={() => {
              resetListingWizard();
            }}
          />
        ) : null}
      </PostWizardShell>

      <PostAdvertPreviewModal
        visible={previewModalOpen}
        draft={wizard.draft}
        onClose={() => setPreviewModalOpen(false)}
        onEdit={() => {
          setPreviewModalOpen(false);
          wizard.setStep('details');
        }}
        onContinue={() => setPreviewModalOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  detailsBlock: {
    gap: Spacing.sm,
  },
  submitErr: {
    ...Typography.body,
    fontWeight: '600',
  },
  mediaHint: {
    ...Typography.body,
    marginBottom: Spacing.sm,
    opacity: 0.75,
  },
  ekuriSwitchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6366f112',
    borderColor: '#6366f1',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  ekuriSwitchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  ekuriIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f122',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ekuriSwitchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4f46e5',
  },
  ekuriSwitchSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  ekuriSwitchBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ekuriSwitchBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
