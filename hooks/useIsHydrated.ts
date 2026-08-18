import { useSyncExternalStore } from 'react';

/**
 * SSR / ilk hydration boyamasında false; hydrate olduktan sonra (ve CSR mount’ta) true.
 * React 418 (hydration mismatch) önlemek için client-only değerleri bunun arkasına alın.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
