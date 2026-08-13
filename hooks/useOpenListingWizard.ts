import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { prepareListingWizardEntry } from '@/services/listing';

/** İlan Ver — yarım kalan adımlar varsa süreci baştan açar. */
export function useOpenListingWizard() {
  const router = useRouter();
  return useCallback(() => {
    prepareListingWizardEntry();
    router.push('/post');
  }, [router]);
}
