import { useCallback, useEffect, useMemo, useState } from 'react';
import { applyTjkProfile } from '@/hooks/useListingWizard';
import { detailsErrors, detailsStepComplete } from '@/services/listing';
import {
  isListingDraftDirty,
  mapDraftToUpdate,
  myListingsRepository,
  type IMyListingsRepository,
} from '@/services/my-listings';
import { tjkRepository, type ITjkRepository } from '@/services/tjk';
import type { ListingDraft, ListingDraftDetails, ListingMediaSlot } from '@/types';
import type { AdvertId } from '@/types/advertId';
import { parseAdvertId } from '@/types/advertId';

export function useMyListingEdit(
  rawId: string | undefined,
  accessToken: string | null,
  repo: IMyListingsRepository = myListingsRepository,
  tjk: ITjkRepository = tjkRepository
) {
  const id = parseAdvertId(rawId) ?? undefined;
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [initialDraft, setInitialDraft] = useState<ListingDraft | null>(null);
  const [version, setVersion] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!id || !accessToken) {
      setLoading(false);
      setError('Oturum veya ilan bulunamadı.');
      return;
    }
    setLoading(true);
    void (async () => {
      try {
        const next = await repo.getEditDraft(id, accessToken);
        if (cancelled) return;
        setDraft(next.draft);
        setInitialDraft(JSON.parse(JSON.stringify(next.draft)));
        setVersion(next.version);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'İlan yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, accessToken, repo]);

  const isDirty = useMemo(() => {
    return isListingDraftDirty(draft, initialDraft);
  }, [draft, initialDraft]);

  const markClean = useCallback((newDraft?: ListingDraft) => {
    setInitialDraft(JSON.parse(JSON.stringify(newDraft ?? draft)));
  }, [draft]);

  const updateDetails = useCallback((partial: Partial<ListingDraftDetails>) => {
    setDraft((prev) =>
      prev
        ? { ...prev, details: { ...prev.details, ...partial } }
        : prev
    );
  }, []);

  const setMedia = useCallback((media: ListingMediaSlot[]) => {
    let next = media;
    if (next.length > 0 && !next.some((m) => m.isCover)) {
      next = next.map((m, i) => (i === 0 ? { ...m, isCover: true } : m));
    }
    setDraft((prev) => (prev ? { ...prev, media: next } : prev));
  }, []);

  const setCover = useCallback((localId: string) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            media: prev.media.map((m) => ({
              ...m,
              isCover: m.localId === localId,
            })),
          }
        : prev
    );
  }, []);

  const applyTjk = useCallback(
    async (horseId: string) => {
      const horse = await tjk.getById(horseId);
      if (!horse) return;
      setDraft((prev) =>
        prev
          ? { ...prev, details: applyTjkProfile(prev.details, horse) }
          : prev
      );
    },
    [tjk]
  );

  const save = useCallback(async () => {
    if (!id || !accessToken || !draft) return false;
    if (!isDirty) return false;
    if (!detailsStepComplete(draft)) {
      setAttempted(true);
      return false;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await repo.update(
        id,
        mapDraftToUpdate(draft, version),
        accessToken
      );
      setVersion((v) => v + 1);
      setInitialDraft(JSON.parse(JSON.stringify(draft)));
      void updated;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [id, accessToken, draft, repo, version, isDirty]);

  return {
    draft,
    initialDraft,
    loading,
    saving,
    error,
    fieldErrors: draft && attempted ? detailsErrors(draft) : {},
    canSave: Boolean(draft && !saving && isDirty),
    isDirty,
    markClean,
    updateDetails,
    setMedia,
    setCover,
    applyTjk,
    save,
  };
}

