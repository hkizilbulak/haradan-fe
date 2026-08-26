import React, { useEffect, useId, useState } from 'react';
import {
  InteractionManager,
  Platform,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

type LazySectionProps = {
  children: React.ReactNode;
  fallback: React.ReactNode;
  /** Above-the-fold: hemen mount. */
  eager?: boolean;
  /** IntersectionObserver rootMargin (web). */
  rootMargin?: string;
  style?: ViewStyle;
};

/**
 * Görünene kadar (veya idle) children mount etmez.
 * Web: IntersectionObserver. Native: InteractionManager.
 * Bir kez açılınca açık kalır — CLS için fallback aynı yükseklikte olmalı.
 */
export function LazySection({
  children,
  fallback,
  eager = false,
  rootMargin = '280px',
  style,
}: LazySectionProps) {
  const reactId = useId();
  const nativeID = `lz${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [mounted, setMounted] = useState(eager);

  useEffect(() => {
    if (eager || mounted) return;

    let cancelled = false;
    let disconnect: (() => void) | undefined;

    const mount = () => {
      if (!cancelled) setMounted(true);
    };

    const bindWeb = () => {
      if (Platform.OS !== 'web' || typeof document === 'undefined') return false;
      if (typeof IntersectionObserver === 'undefined') return false;
      const el = document.getElementById(nativeID);
      if (!el) return false;

      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            mount();
            io.disconnect();
          }
        },
        { root: null, rootMargin, threshold: 0 }
      );
      io.observe(el);
      disconnect = () => io.disconnect();
      return true;
    };

    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      if (bindWeb()) return;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const ric = (
          window as Window & {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
            cancelIdleCallback?: (id: number) => void;
          }
        ).requestIdleCallback;
        if (ric) {
          const id = ric(mount, { timeout: 400 });
          disconnect = () =>
            (
              window as Window & { cancelIdleCallback?: (id: number) => void }
            ).cancelIdleCallback?.(id);
          return;
        }
      }

      const task = InteractionManager.runAfterInteractions(mount);
      disconnect = () => task.cancel();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      disconnect?.();
    };
  }, [eager, mounted, nativeID, rootMargin]);

  return (
    <View
      nativeID={nativeID}
      collapsable={false}
      style={[styles.wrap, style]}
    >
      {mounted ? children : fallback}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
});
