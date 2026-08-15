import { useCallback, useEffect, useState } from 'react';
import {
  locationLookup,
  type DistrictOption,
  type ProvinceOption,
} from '@/services/location';

export function useProvinces() {
  const [items, setItems] = useState<ProvinceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const retry = useCallback(() => {
    locationLookup.invalidate();
    setLoading(true);
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await locationLookup.listProvinces();
        if (cancelled) return;
        setItems(next);
        setError(
          next.length === 0 ? 'İl listesi şu anda boş. Yeniden deneyin.' : null
        );
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'İller yüklenemedi.');
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return { items, loading, error, retry };
}

export function useDistricts(provinceId: string | null) {
  const [items, setItems] = useState<DistrictOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const retry = useCallback(() => {
    locationLookup.invalidate();
    if (provinceId) setLoading(true);
    setError(null);
    setNonce((n) => n + 1);
  }, [provinceId]);

  useEffect(() => {
    if (!provinceId) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const next = await locationLookup.listDistricts(provinceId);
        if (cancelled) return;
        setItems(next);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'İlçeler yüklenemedi.');
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [provinceId, nonce]);

  return { items, loading, error, retry };
}
