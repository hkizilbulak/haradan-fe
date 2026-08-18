import { useEffect, useState } from 'react';
import { bannerRepository } from '@/services/banners';
import type { ActiveBannerItem, BannerPlacement } from '@/types';

export function usePlacementBanners(placement: BannerPlacement) {
  const [banners, setBanners] = useState<ActiveBannerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    bannerRepository
      .getActiveBanners(placement)
      .then((items) => {
        if (!cancelled) {
          setBanners(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBanners([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [placement]);

  return { banners, loading };
}
