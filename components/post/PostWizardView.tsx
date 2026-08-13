import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { PostWizardShell } from './PostWizardShell';
import { PostTypeStep } from './PostTypeStep';
import { PostDetailsStep } from './PostDetailsStep';
import { PostPackagesStep } from './PostPackagesStep';
import { PostPaymentStep } from './PostPaymentStep';
import { useCatalogFacets } from '@/hooks/useCatalogFacets';
import { useListingPackages } from '@/hooks/useListingPackages';
import { useListingWizard } from '@/hooks/useListingWizard';
import { useListingWizardBack } from '@/hooks/useListingWizardBack';
import { useAuthSession } from '@/hooks/useAuthSession';
import { parseInternationalPhone } from '@/services/phone';
import type { ListingWizardStep } from '@/types/listing';

export function PostWizardView() {
  const router = useRouter();
  const { session, isLoggedIn } = useAuthSession();
  const { categoryTree } = useCatalogFacets();
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
      if (!isLoggedIn || !session) {
        router.push('/auth/login?next=/post');
        return;
      }
      setSubmitting(true);
      try {
        await wizard.submitDraft(session.accessToken);
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'Taslak oluşturulamadı.'
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }
    wizard.goNext();
  }, [wizard, isLoggedIn, session, router]);

  const nextLabel = wizard.step === 'package' ? 'Ödemeye geç' : 'Devam et';

  const showBack =
    wizard.step !== 'type' || wizard.typePhase !== 'root';
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
          error={submitError ?? packageError}
          onSelect={wizard.selectPackage}
        />
      ) : null}
      {wizard.step === 'payment' ? (
        <PostPaymentStep
          payment={wizard.payment}
          loading={submitting}
          draftId={wizard.submittedDraftId}
          accessToken={session?.accessToken ?? null}
        />
      ) : null}
    </PostWizardShell>
  );
}
