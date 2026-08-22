import React from 'react';
import { usePathname } from 'expo-router';
import { MobileGlassDock } from './MobileGlassDock';
import { shouldShowMobileDock } from '@/constants/Layout';
import { useIsWideLayout } from '@/hooks/useLayoutWidth';

/**
 * Mobil alt dock — root layout'ta tek instance.
 * Tab bar height:0 kırpmasından bağımsız, viewport'a sabitlenir.
 */
export function MobileDockHost() {
  const isWide = useIsWideLayout();
  const pathname = usePathname();

  if (isWide || !shouldShowMobileDock(pathname)) {
    return null;
  }

  return <MobileGlassDock />;
}
