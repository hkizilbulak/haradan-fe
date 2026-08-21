import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  detailsStepComplete,
  isListingPackageStepEnabled,
  isPaytrCheckoutEnabled,
} from '@/services/listing';
import { parseInternationalPhone } from '@/services/phone';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { ListingWizardStep } from '@/types/listing';

export function PostWizardView() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollTrigger, setScrollTrigger] = useState(0);
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

  useEffect(() => {
    const phone = session?.user.phone;
    if (phone && !wizard.draft.details.sellerPhone) {
      const parsed = parseInternationalPhone(phone);
      wizard.updateDetails({
        phoneCountryIso: parsed.iso,
        sellerPhone: parsed.national,
      });
    }
  }, [session?.user.phone, wizard.draft.details.sellerPhone, wizard.updateDetails]);

  const close = useCallback(() => {
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

  const onNext = useCallback(async () => {
    setSubmitError(null);
    if (wizard.step === 'details') {
      if (!detailsStepComplete(wizard.draft)) {
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
  }, [wizard, packageStepEnabled, submitListing]);

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
        />
      ) : null}
      {wizard.step === 'details' ? (
        <View style={styles.detailsBlock}>
          {submitError && !packageStepEnabled ? (
            <Text style={[styles.submitErr, { color: errorColor }]}>{submitError}</Text>
          ) : null}
          <PostDetailsStep
            draft={wizard.draft}
            errors={wizard.fieldErrors}
            tjkPromptSeen={wizard.tjkPromptSeen}
            scrollViewRef={scrollViewRef}
            scrollTrigger={scrollTrigger}
            onUpdate={wizard.updateDetails}
            onMediaChange={wizard.setMedia}
            onSetCover={wizard.setCover}
            onApplyTjk={wizard.applyTjk}
            onSkipTjk={wizard.skipTjk}
            onMarkTjkSeen={wizard.markTjkPromptSeen}
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
