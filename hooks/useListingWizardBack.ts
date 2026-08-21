import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import type { ListingTypePhase } from '@/services/listing';
import {
  setListingWizardState,
  isListingPackageStepEnabled,
  isPaytrCheckoutEnabled,
} from '@/services/listing';
import type { ListingWizardStep } from '@/types/listing';

const HISTORY_KEY = 'haradanWizard';

type WizardHistoryState = {
  step: ListingWizardStep;
  typePhase: ListingTypePhase;
};

function depth(step: ListingWizardStep, typePhase: ListingTypePhase): number {
  if (step === 'type') return typePhase === 'category' ? 1 : 0;
  if (step === 'details') return 2;
  if (step === 'package') return 3;
  if (step === 'payment') return 4;
  if (!isListingPackageStepEnabled()) return 3;
  return isPaytrCheckoutEnabled() ? 5 : 4;
}

function isFirstStep(step: ListingWizardStep, typePhase: ListingTypePhase): boolean {
  return step === 'type' && typePhase === 'root';
}

function isPostPath(): boolean {
  if (typeof window === 'undefined') return false;
  return /\/post(\/|$)/.test(window.location.pathname);
}

function readHistoryState(raw: unknown): WizardHistoryState | null {
  if (!raw || typeof raw !== 'object') return null;
  const nested = (raw as Record<string, unknown>)[HISTORY_KEY];
  if (!nested || typeof nested !== 'object') return null;
  const step = (nested as WizardHistoryState).step;
  const typePhase = (nested as WizardHistoryState).typePhase;
  if (!step || !typePhase) return null;
  return { step, typePhase };
}

function writeHistory(
  snapshot: WizardHistoryState,
  mode: 'push' | 'replace'
): void {
  if (typeof window === 'undefined') return;
  const prev =
    window.history.state && typeof window.history.state === 'object'
      ? window.history.state
      : {};
  const next = { ...prev, [HISTORY_KEY]: snapshot };
  if (mode === 'push') window.history.pushState(next, '');
  else window.history.replaceState(next, '');
}

type UseListingWizardBackArgs = {
  step: ListingWizardStep;
  typePhase: ListingTypePhase;
  goBack: () => void;
};

/**
 * Geri: tarayıcı / donanım / jestür → bir önceki adım.
 * İlk adımdaysa sihirbazdan çıkışa izin verilir.
 */
export function useListingWizardBack({
  step,
  typePhase,
  goBack,
}: UseListingWizardBackArgs) {
  const navigation = useNavigation();
  const first = isFirstStep(step, typePhase);
  const snapshotRef = useRef<WizardHistoryState>({ step, typePhase });
  const skipPushRef = useRef(false);
  const lastDepthRef = useRef(depth(step, typePhase));
  const firstRef = useRef(first);
  const goBackRef = useRef(goBack);

  snapshotRef.current = { step, typePhase };
  firstRef.current = first;
  goBackRef.current = goBack;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const nextDepth = depth(step, typePhase);
    if (skipPushRef.current) {
      skipPushRef.current = false;
      lastDepthRef.current = nextDepth;
      writeHistory({ step, typePhase }, 'replace');
      return;
    }

    if (lastDepthRef.current === nextDepth) {
      writeHistory({ step, typePhase }, 'replace');
      return;
    }

    const goingForward = nextDepth > lastDepthRef.current;
    lastDepthRef.current = nextDepth;
    writeHistory({ step, typePhase }, goingForward ? 'push' : 'replace');
  }, [step, typePhase]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onPopState = (event: PopStateEvent) => {
      const restored = readHistoryState(event.state);
      if (restored) {
        skipPushRef.current = true;
        setListingWizardState((prev) => ({
          ...prev,
          step: restored.step,
          typePhase: restored.typePhase,
        }));
        return;
      }
      if (firstRef.current || !isPostPath()) return;
      writeHistory(snapshotRef.current, 'push');
      goBackRef.current();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const unsub = navigation.addListener('beforeRemove', (e) => {
      const action = e.data.action.type;
      if (action !== 'GO_BACK' && action !== 'POP') return;
      if (firstRef.current) return;
      e.preventDefault();
      goBackRef.current();
    });
    return unsub;
  }, [navigation]);

  const back = useCallback(() => {
    if (firstRef.current) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.back();
      return;
    }
    goBackRef.current();
  }, []);

  const unwindAndExit = useCallback((exit: () => void) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const d = depth(snapshotRef.current.step, snapshotRef.current.typePhase);
      if (d > 0) {
        window.history.go(-d);
        setTimeout(exit, 0);
        return;
      }
    }
    exit();
  }, []);

  return { back, unwindAndExit, isFirstStep: first };
}
