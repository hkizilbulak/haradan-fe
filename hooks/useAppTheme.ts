import { useSyncExternalStore } from 'react';
import {
  getThemePreference,
  getResolvedTheme,
  setThemePreference,
  subscribeTheme,
  type ThemePreference,
  type ResolvedTheme,
} from '@/services/theme/themeStore';
import { useIsHydrated } from '@/hooks/useIsHydrated';

export function useAppTheme() {
  const hydrated = useIsHydrated();

  const themePreference = useSyncExternalStore(
    subscribeTheme,
    getThemePreference,
    () => 'system' as ThemePreference
  );

  const resolved = useSyncExternalStore(
    subscribeTheme,
    getResolvedTheme,
    () => 'light' as ResolvedTheme
  );

  const resolvedTheme: ResolvedTheme = !hydrated ? 'light' : resolved;

  return {
    themePreference,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    setThemePreference,
  };
}

export type { ThemePreference, ResolvedTheme };
