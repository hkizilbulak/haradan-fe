import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { PostWizardShell } from './PostWizardShell';
import { PostTypeStep } from './PostTypeStep';
import { PostDetailsStep } from './PostDetailsStep';
import { PostPackagesStep } from './PostPackagesStep';
import { PostReviewStep } from './PostReviewStep';
import { useCatalogFacets } from '@/hooks/useCatalogFacets';
import { useListingPackages } from '@/hooks/useListingPackages';
import { useListingWizard } from '@/hooks/useListingWizard';
import { useListingWizardBack } from '@/hooks/useListingWizardBack';
import { useAuthSession } from '@/hooks/useAuthSession';
import { getValidAccessToken } from '@/services/auth';
import { parseInternationalPhone } from '@/services/phone';
import type { ListingWizardStep } from '@/types/listing';

export function PostWizardView() {
  const router = useRouter();
  const { session, isLoggedIn } = useAuthSession();
  const { categoryTree, error: catalogError, loading: catalogLoading } = useCatalogFacets();
  const { packages, error: packageError } = useListingPackages();
  const wizard = useListingWizard();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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

  const onNext = useCallback(async () => {
    setSubmitError(null);
    if (wizard.step === 'package') {
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
        await wizard.publishListing(token);
      } catch (err) {
        const code =
          err && typeof err === 'object' && 'code' in err
            ? String((err as { code?: string }).code)
            : null;
        if (code === 'EMAIL_NOT_VERIFIED') {
          setSubmitError(
            'E-posta adresiniz doğrulanmadan ilan gönderilemez. Gelen kutusundaki bağlantıyı kullanın.'
          );
        } else {
          setSubmitError(
            err instanceof Error ? err.message : 'İlan gönderilemedi.'
          );
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }
    wizard.goNext();
  }, [wizard, isLoggedIn, router]);

  const nextLabel = wizard.step === 'package' ? 'İncelemeye gönder' : 'Devam et';
  const showBack = wizard.step !== 'type' || wizard.typePhase !== 'root';
  const showNext = wizard.step === 'details' || wizard.step === 'package';

  return (
    <PostWizardShell
      step={wizard.step}
      canNext={wizard.canNext}
      nextLabel={nextLabel}
      nextLoading={submitting}
      showBack={showBack}
      showNext={showNext}
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
        <PostDetailsStep
          draft={wizard.draft}
          errors={wizard.fieldErrors}
          tjkPromptSeen={wizard.tjkPromptSeen}
          onUpdate={wizard.updateDetails}
          onMediaChange={wizard.setMedia}
          onSetCover={wizard.setCover}
          onApplyTjk={wizard.applyTjk}
          onSkipTjk={wizard.skipTjk}
          onMarkTjkSeen={wizard.markTjkPromptSeen}
        />
      ) : null}
      {wizard.step === 'package' ? (
        <PostPackagesStep
          packages={packages}
          selected={wizard.draft.packageCode}
          error={submitError ?? packageError ?? catalogError}
          onSelect={wizard.selectPackage}
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
