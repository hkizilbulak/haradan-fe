import { useWindowDimensions } from 'react-native';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { useIsHydrated } from '@/hooks/useIsHydrated';

/**
 * Hydration boyunca sabit genişlik — `useWindowDimensions` sunucuda 0, tarayıcıda gerçek
 * değer verince ana sayfa sidebar/header ağacı React #418 ile kırılıyordu.
 */
export function useLayoutWidth(): number {
  const { width } = useWindowDimensions();
  const hydrated = useIsHydrated();
  return hydrated ? width : HOME_DESKTOP_BREAKPOINT;
}

export function useIsWideLayout(breakpoint = HOME_DESKTOP_BREAKPOINT): boolean {
  return useLayoutWidth() >= breakpoint;
}
