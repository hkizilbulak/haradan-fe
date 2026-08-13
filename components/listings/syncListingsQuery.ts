import { Platform } from 'react-native';
import type { Router } from 'expo-router';

/**
 * Filtre URL’sini kaydırmadan günceller.
 * Web’de history.replaceState — router.replace sayfayı başa alır.
 */
export function syncListingsQuery(qs: string, router: Router) {
  const path = qs ? `/listings?${qs}` : '/listings';

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { scrollX, scrollY } = window;
    window.history.replaceState(window.history.state ?? {}, '', path);
    window.scrollTo(scrollX, scrollY);
    return;
  }

  router.replace(path as '/listings');
}
