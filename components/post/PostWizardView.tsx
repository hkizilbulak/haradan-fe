import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PostWizardShell } from './PostWizardShell';
import { PostTypeStep } from './PostTypeStep';
import { PostDetailsStep } from './PostDetailsStep';
import { PostPackagesStep } from './PostPackagesStep';
import { PostPaymentStep } from './PostPaymentStep';
import { PostReviewStep } from './PostReviewStep';
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

export function PostWizardView() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [loadedCategoryProperties, setLoadedCategoryProperties] = useState<CategoryPropertyPublic[]>([]);
  const [globalConfigs, setGlobalConfigs] = useState<GlobalPropertiesMap>(getGlobalPropertiesConfig());
  const [customGlobalProperties, setCustomGlobalProperties] = useState<CategoryPropertyPublic[]>([]);
  const { session, isLoggedIn } = useAuthSession();
  const { categoryTree, error: catalogError, loading: catalogLoading } = useCatalogFacets();
  const { packages, error: packageError } = useListingPackages();
  const wizard = useListingWizard();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const packageStepEnabled = isListingPackageStepEnabled();
  const paytrEnabled = packageStepEnabled && isPaytrCheckoutEnabled();
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
      .getCategoryFormDefinition('ortak-alanlar', { fresh: true, categorySlug: 'ortak-alanlar' })
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
        await wizard.publishListing(token);
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
      if (!packageStepEnabled) {
        await submitListing();
        return;
      }
      wizard.goNext();
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
  ]);

  const nextLabel =
    wizard.step === 'details' && !packageStepEnabled
      ? 'İncelemeye gönder'
      : wizard.step === 'package'
        ? paytrEnabled
          ? 'Ödemeye geç'
          : 'İncelemeye gönder'
        : 'Devam et';
  const showBack = wizard.step !== 'type' || wizard.typePhase !== 'root';
  const showNext =
    wizard.step === 'details' ||
    (packageStepEnabled && wizard.step === 'package');

  return (
    <PostWizardShell
      step={wizard.step}
      canNext={wizard.canNext}
      nextLabel={nextLabel}
      nextLoading={submitting}
      showBack={showBack}
      showNext={showNext}
      scrollViewRef={scrollViewRef}
      onClose={close}
      onBack={back}
      onNext={() => void onNext()}
      onPressStep={(key: ListingWizardStep) => wizard.setStep(key)}
    >
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
        <PostPackagesStep
          packages={packages}
          selected={wizard.draft.packageCode}
          error={submitError ?? packageError ?? catalogError}
          onSelect={wizard.selectPackage}
        />
      ) : null}
      {wizard.step === 'payment' && paytrEnabled ? (
        <PostPaymentStep
          iframeUrl={wizard.paytrIframeUrl}
          error={submitError}
        />
      ) : null}
      {wizard.step === 'review' ? (
        <PostReviewStep
          advertId={wizard.submittedDraftId}
          status={wizard.submittedStatus}
          title={wizard.draft.details.title}
          onGoListings={() => router.replace('/my-listings')}
          onGoHome={() => router.replace('/')}
        />
      ) : null}
    </PostWizardShell>
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
});
